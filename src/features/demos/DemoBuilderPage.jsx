import { Link } from 'react-router-dom'
import { ChevronDown, ExternalLink, Hammer, Rocket, Send, Sparkles, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useProspects } from '../prospects/ProspectsContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { demoStatuses, labelFor } from '../prospects/prospectOptions'

function deploymentLabel(status) {
  switch (status) {
    case 'publishing': return 'Publishing to GitHub Pages'
    case 'live': return 'Live'
    case 'failed': return 'Failed'
    default: return 'Not deployed'
  }
}

export function DemoBuilderPage() {
  const { prospects, updateProspect, addActivity, generateDemoPlan, generateAiDemo, markDemoReady, markDemoSent, slugForProspect } = useProspects()
  const demoProspects = useMemo(() => prospects.filter((prospect) => !['won', 'lost'].includes(prospect.status)), [prospects])
  const [selectedId, setSelectedId] = useState(demoProspects[0]?.id || '')
  const selected = demoProspects.find((prospect) => prospect.id === selectedId) || demoProspects[0]
  const [saved, setSaved] = useState('')
  const [isTutorialCollapsed, setIsTutorialCollapsed] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [checkingLive, setCheckingLive] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)

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

  async function checkPreviewIsLive(prospect = selected, options = {}) {
    if (!prospect?.preview_url) {
      toast.error('No preview URL to check')
      return false
    }

    setCheckingLive(true)
    try {
      const separator = prospect.preview_url.includes('?') ? '&' : '?'
      const response = await fetch(`${prospect.preview_url}${separator}check=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      })

      if (response.ok) {
        await updateProspect(prospect.id, {
          deployment_status: 'live',
          demo_status: 'ready',
          status: 'demo_ready',
          deployment_checked_at: new Date().toISOString(),
        })
        if (!options.silent) toast.success('Demo is live. Preview is ready.')
        return true
      }

      await updateProspect(prospect.id, {
        deployment_status: 'publishing',
        deployment_checked_at: new Date().toISOString(),
      })
      if (!options.silent) toast('Still publishing. Try again in a minute.')
      return false
    } catch (error) {
      await updateProspect(prospect.id, {
        deployment_status: 'publishing',
        deployment_checked_at: new Date().toISOString(),
      })
      if (!options.silent) toast('Still publishing. GitHub Pages may need a little more time.')
      return false
    } finally {
      setCheckingLive(false)
    }
  }


  async function generateWithAi() {
    if (!selected) return
    setGeneratingAi(true)
    toast.loading('Researching business and designing demo page...', { id: 'ai-demo' })
    const result = await generateAiDemo(selected.id)
    if (!result.error) {
      toast.success('AI-designed demo generated', { id: 'ai-demo' })
      setSaved('AI demo designed')
      window.setTimeout(() => setSaved(''), 1400)
    } else {
      toast.error(result.error.message || 'Unable to generate AI-designed demo', { id: 'ai-demo' })
    }
    setGeneratingAi(false)
  }

  async function deployDemoSite() {
    if (!selected) return
    setDeploying(true)
    toast.loading('Deploying demo site...', { id: 'deploy-demo' })

    try {
      await updateProspect(selected.id, {
        deployment_status: 'publishing',
        demo_status: 'building',
      })

      if (!isSupabaseConfigured) {
        const slug = slugForProspect(selected)
        const previewUrl = `https://joannembl.github.io/crafted-digital-demos/${slug}/`
        const result = await updateProspect(selected.id, {
          preview_url: previewUrl,
          demo_status: 'building',
          deployment_status: 'publishing',
          status: 'demo_ready',
        })
        if (!result.error) {
          await addActivity(selected.id, { type: 'Demo', note: `Demo deployment simulated: ${previewUrl}` })
          toast.success('Demo sent to publishing queue', { id: 'deploy-demo' })
          setSaved('Demo publishing')
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
        demo_status: 'building',
        deployment_status: 'publishing',
        status: 'demo_ready',
        deployment_checked_at: null,
      })

      if (result.error) throw result.error

      await addActivity(selected.id, { type: 'Demo', note: `Demo site pushed to GitHub Pages and is publishing: ${data.previewUrl}` })
      toast.success('Demo is publishing. GitHub Pages may take a few minutes.', { id: 'deploy-demo' })
      setSaved('Publishing')
      window.setTimeout(() => setSaved(''), 1400)
    } catch (error) {
      await updateProspect(selected.id, { deployment_status: 'failed' })
      toast.error(error.message || 'Unable to deploy demo site', { id: 'deploy-demo' })
    } finally {
      setDeploying(false)
    }
  }

  useEffect(() => {
    if (!selected?.preview_url || selected.deployment_status !== 'publishing') return undefined

    const interval = window.setInterval(() => {
      checkPreviewIsLive(selected, { silent: true })
    }, 20000)

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
    }, 240000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [selected?.id, selected?.preview_url, selected?.deployment_status])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phase 9.3</p>
          <h1>Demo Builder</h1>
          <p>Pick a prospect, generate an AI-designed demo page, deploy it, then wait for GitHub Pages to finish publishing.</p>
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
            <article className="tutorial-step"><span>1</span><div><h3>Pick a prospect</h3><p>Select the business from the Demo queue. If the queue is empty, add the business on the Prospects page first.</p></div></article>
            <article className="tutorial-step"><span>2</span><div><h3>Generate the plan</h3><p>Click <strong>Generate with AI</strong> to research the business, generate copy, and create a polished custom demo page.</p></div></article>
            <article className="tutorial-step"><span>3</span><div><h3>Refine the copy</h3><p>Review the AI research summary, demo copy, and design notes before publishing.</p></div></article>
            <article className="tutorial-step"><span>4</span><div><h3>Deploy the demo</h3><p>Click <strong>Deploy to GitHub Pages</strong>. The OS will push the AI-generated HTML/CSS files and mark the site as publishing.</p></div></article>
            <article className="tutorial-step"><span>5</span><div><h3>Wait for publishing</h3><p>GitHub Pages can take 1–3 minutes. Use <strong>Check if live</strong> until the preview is ready.</p></div></article>
            <article className="tutorial-step"><span>6</span><div><h3>Send and follow up</h3><p>After you text, DM, or email the demo, click <strong>Mark Sent + Follow Up</strong>. The OS will schedule the next follow-up automatically.</p></div></article>
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

            {selected.deployment_status === 'publishing' ? (
              <div className="publishing-callout">
                <div>
                  <strong>Publishing to GitHub Pages…</strong>
                  <p>Your demo files were pushed successfully. GitHub Pages may take 1–3 minutes before the preview URL stops showing 404.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => checkPreviewIsLive()} disabled={checkingLive}>
                  <RefreshCw size={16} /> {checkingLive ? 'Checking...' : 'Check if live'}
                </button>
              </div>
            ) : null}

            <div className="status-row">
              <span className={`status-chip deployment-${selected.deployment_status || 'idle'}`}>{deploymentLabel(selected.deployment_status)}</span>
              {selected.ai_generated_at ? <span className="status-chip">AI generated {new Date(selected.ai_generated_at).toLocaleDateString()}</span> : null}
            </div>

            {selected.ai_research_summary ? (
              <div className="ai-research-card">
                <div>
                  <p className="eyebrow">AI Research</p>
                  <p>{selected.ai_research_summary}</p>
                </div>
                {selected.ai_source_links ? <pre>{selected.ai_source_links}</pre> : null}
              </div>
            ) : null}

            <div className="action-row">
              <button className="primary-button" type="button" onClick={generateWithAi} disabled={generatingAi}>
                <Sparkles size={16} /> {generatingAi ? 'Generating with AI...' : 'Generate with AI'}
              </button>
              <button className="secondary-button" type="button" onClick={() => runAction(generateDemoPlan, 'Demo plan generated')}>
                <Sparkles size={16} /> Basic Demo Plan
              </button>
              <button className="secondary-button" type="button" onClick={deployDemoSite} disabled={deploying || selected.deployment_status === 'publishing'}>
                <Rocket size={16} /> {deploying ? 'Deploying...' : selected.deployment_status === 'publishing' ? 'Publishing...' : 'Deploy to GitHub Pages'}
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
              <label>Preview URL<input value={selected.preview_url || ''} onChange={(e) => patch({ preview_url: e.target.value, deployment_status: e.target.value ? 'live' : 'idle' })} placeholder="https://demo.netlify.app" /></label>
              <label>Live URL<input value={selected.live_url || ''} onChange={(e) => patch({ live_url: e.target.value })} placeholder="https://clientdomain.com" /></label>
              <label>Demo status<select value={selected.demo_status || 'not_started'} onChange={(e) => patch({ demo_status: e.target.value })}>{demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label>Next follow-up<input type="date" value={selected.next_follow_up || ''} onChange={(e) => patch({ next_follow_up: e.target.value || null })} /></label>
              <label className="span-2">Build notes<textarea value={selected.demo_notes || ''} onChange={(e) => patch({ demo_notes: e.target.value })} placeholder="Photos needed, colors, sections, add-ons, etc." /></label>
            </div>

            <div className="link-row">
              {selected.preview_url && selected.deployment_status !== 'publishing' ? <a className="secondary-button" href={selected.preview_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open preview</a> : null}
              {selected.preview_url && selected.deployment_status === 'publishing' ? <button className="secondary-button" type="button" disabled><ExternalLink size={16} /> Preview available after publishing</button> : null}
              {selected.live_url ? <a className="secondary-button" href={selected.live_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open live site</a> : null}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
