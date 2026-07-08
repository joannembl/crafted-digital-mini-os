import { Link } from 'react-router-dom'
import { ChevronDown, ExternalLink, Hammer, Rocket, Send, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useProspects } from '../prospects/ProspectsContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { demoStatuses, labelFor } from '../prospects/prospectOptions'

export function DemoBuilderPage() {
  const { prospects, updateProspect, addActivity, generateDemoPlan, markDemoReady, markDemoSent, slugForProspect } = useProspects()
  const demoProspects = useMemo(() => prospects.filter((prospect) => !['won', 'lost'].includes(prospect.status)), [prospects])
  const [selectedId, setSelectedId] = useState(demoProspects[0]?.id || '')
  const selected = demoProspects.find((prospect) => prospect.id === selectedId) || demoProspects[0]
  const [saved, setSaved] = useState('')
  const [isTutorialCollapsed, setIsTutorialCollapsed] = useState(false)
  const [deploying, setDeploying] = useState(false)

  async function patch(values, message = 'Saved') {
    if (!selected) return
    const result = await updateProspect(selected.id, values)
    if (!result.error) {
      setSaved(message)
      window.setTimeout(() => setSaved(''), 1400)
    }
    return result
  }

  async function runAction(action, message) {
    if (!selected) return
    const result = await action(selected.id)
    if (!result.error) {
      setSaved(message)
      toast.success(message)
      window.setTimeout(() => setSaved(''), 1400)
    } else {
      toast.error(result.error.message || 'Action failed')
    }
  }


  async function deployDemoSite() {
    if (!selected) return
    setDeploying(true)
    toast.loading('Deploying demo site...', { id: 'deploy-demo' })

    try {
      if (!isSupabaseConfigured) {
        const slug = slugForProspect(selected)
        const previewUrl = `https://joannembl.github.io/crafted-digital-demos/${slug}/`
        const result = await updateProspect(selected.id, {
          preview_url: previewUrl,
          demo_status: 'ready',
          status: 'demo_ready',
        })
        if (!result.error) {
          await addActivity(selected.id, { type: 'Demo', note: `Demo deployment simulated: ${previewUrl}` })
          toast.success('Demo preview URL saved', { id: 'deploy-demo' })
          setSaved('Demo preview saved')
        } else {
          toast.error(result.error.message || 'Unable to save preview URL', { id: 'deploy-demo' })
        }
        setDeploying(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('deploy-demo-site', {
        body: { prospect: selected },
      })

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Unable to deploy demo site')
      }

      const result = await updateProspect(selected.id, {
        preview_url: data.previewUrl,
        demo_status: 'ready',
        status: 'demo_ready',
      })

      if (result.error) throw result.error

      await addActivity(selected.id, { type: 'Demo', note: `Demo site deployed to GitHub Pages: ${data.previewUrl}` })
      toast.success('Demo deployed to GitHub Pages', { id: 'deploy-demo' })
      setSaved('Demo deployed')
      window.setTimeout(() => setSaved(''), 1400)
    } catch (error) {
      toast.error(error.message || 'Unable to deploy demo site', { id: 'deploy-demo' })
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phase 3</p>
          <h1>Demo Builder</h1>
          <p>Pick a prospect, shape the demo plan, save the preview URL, then mark it ready or sent.</p>
        </div>
        {saved && <span className="save-pill">{saved}</span>}
      </header>


      <section className="panel collapsible-panel tutorial-panel">
        <button
          className="collapsible-panel-header"
          type="button"
          onClick={() => setIsTutorialCollapsed((current) => !current)}
          aria-expanded={!isTutorialCollapsed}
        >
          <div>
            <p className="eyebrow">Step-by-step</p>
            <h2>How to use the Demo Builder</h2>
          </div>
          <ChevronDown className={isTutorialCollapsed ? 'chevron collapsed' : 'chevron'} size={18} />
        </button>

        {!isTutorialCollapsed && (
          <div className="tutorial-steps">
            <article className="tutorial-step">
              <span>1</span>
              <div>
                <h3>Pick a prospect</h3>
                <p>Select the business from the Demo queue. If the queue is empty, add the business on the Prospects page first.</p>
              </div>
            </article>
            <article className="tutorial-step">
              <span>2</span>
              <div>
                <h3>Generate the plan</h3>
                <p>Click <strong>Generate Demo Plan</strong> to create a starting brief, section outline, and website copy based on the prospect details.</p>
              </div>
            </article>
            <article className="tutorial-step">
              <span>3</span>
              <div>
                <h3>Refine the copy</h3>
                <p>Edit the demo brief, site structure, and build notes so the demo feels personal to that business.</p>
              </div>
            </article>
            <article className="tutorial-step">
              <span>4</span>
              <div>
                <h3>Add the preview link</h3>
                <p>Paste the Netlify, Cloudflare, or GitHub Pages preview URL into <strong>Preview URL</strong>.</p>
              </div>
            </article>
            <article className="tutorial-step">
              <span>5</span>
              <div>
                <h3>Mark the demo ready</h3>
                <p>Use <strong>Mark Ready</strong> once the preview is good enough to show the owner.</p>
              </div>
            </article>
            <article className="tutorial-step">
              <span>6</span>
              <div>
                <h3>Send and follow up</h3>
                <p>After you text, DM, or email the demo, click <strong>Mark Sent + Follow Up</strong>. The OS will schedule the next follow-up automatically.</p>
              </div>
            </article>
          </div>
        )}
      </section>

      {demoProspects.length === 0 ? (
        <section className="panel empty-state">
          <Hammer size={34} />
          <h2>No active prospects yet</h2>
          <p>Add a prospect first, then come back here to build their demo workflow.</p>
          <Link className="primary-button" to="/prospects">Add prospect</Link>
        </section>
      ) : (
        <div className="builder-grid">
          <aside className="panel builder-list">
            <h2>Demo queue</h2>
            <div className="mini-list compact-list">
              {demoProspects.map((prospect) => (
                <button
                  key={prospect.id}
                  className={`queue-item ${selected?.id === prospect.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => setSelectedId(prospect.id)}
                >
                  <strong>{prospect.business_name}</strong>
                  <span>{labelFor(demoStatuses, prospect.demo_status)}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel builder-main">
            <div className="builder-title-row">
              <div>
                <p className="eyebrow">Selected Prospect</p>
                <h2>{selected.business_name}</h2>
                <p>{selected.category || 'No category'} · Demo status: {labelFor(demoStatuses, selected.demo_status)}</p>
              </div>
              <Link className="secondary-button" to={`/prospects/${slugForProspect(selected)}`}>Open workspace</Link>
            </div>

            <div className="action-row">
              <button className="primary-button" type="button" onClick={() => runAction(generateDemoPlan, 'Demo plan generated')}>
                <Sparkles size={16} /> Generate Demo Plan
              </button>
              <button className="secondary-button" type="button" onClick={deployDemoSite} disabled={deploying}>
                <Rocket size={16} /> {deploying ? 'Deploying...' : 'Deploy to GitHub Pages'}
              </button>
              <button className="secondary-button" type="button" onClick={() => markDemoReady(selected.id, selected.preview_url).then((result) => { if (!result.error) { setSaved('Demo marked ready'); toast.success('Demo marked ready') } else toast.error(result.error.message || 'Unable to mark demo ready') })}>
                <Hammer size={16} /> Mark Ready
              </button>
              <button className="secondary-button" type="button" onClick={() => runAction(markDemoSent, 'Demo marked sent')}>
                <Send size={16} /> Mark Sent + Follow Up
              </button>
            </div>

            <div className="form-grid compact">
              <label className="span-2">Demo brief<textarea value={selected.demo_brief || ''} onChange={(e) => patch({ demo_brief: e.target.value })} placeholder="What should this demo focus on?" /></label>
              <label className="span-2 tall-textarea">Generated copy / site structure<textarea value={selected.demo_copy || ''} onChange={(e) => patch({ demo_copy: e.target.value })} placeholder="Hero copy, sections, CTA, notes..." /></label>
              <label>Preview URL<input value={selected.preview_url || ''} onChange={(e) => patch({ preview_url: e.target.value })} placeholder="https://demo.netlify.app" /></label>
              <label>Live URL<input value={selected.live_url || ''} onChange={(e) => patch({ live_url: e.target.value })} placeholder="https://clientdomain.com" /></label>
              <label>Demo status<select value={selected.demo_status || 'not_started'} onChange={(e) => patch({ demo_status: e.target.value })}>{demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label>Next follow-up<input type="date" value={selected.next_follow_up || ''} onChange={(e) => patch({ next_follow_up: e.target.value || null })} /></label>
              <label className="span-2">Build notes<textarea value={selected.demo_notes || ''} onChange={(e) => patch({ demo_notes: e.target.value })} placeholder="Photos needed, colors, sections, add-ons, etc." /></label>
            </div>

            <div className="link-row">
              {selected.preview_url ? <a className="secondary-button" href={selected.preview_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open preview</a> : null}
              {selected.live_url ? <a className="secondary-button" href={selected.live_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open live site</a> : null}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
