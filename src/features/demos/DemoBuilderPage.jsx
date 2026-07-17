import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ExternalLink, Hammer, Rocket, Send, Sparkles, RefreshCw, RotateCcw, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useProspects } from '../prospects/ProspectsContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { demoStatuses, labelFor } from '../prospects/prospectOptions'
import { getCategoryKey, getThemeOptions, LAYOUT_OPTIONS } from '../../../supabase/functions/_shared/demo-forge'

function deploymentLabel(status) {
  switch (status) {
    case 'publishing': return 'Publishing to GitHub Pages'
    case 'live': return 'Live'
    case 'failed': return 'Failed'
    default: return 'Not deployed'
  }
}

export function DemoBuilderPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { prospects, updateProspect, addActivity, clearDemo, generateDemoPlan, generateForgeDemo, generateAiDemo, markDemoReady, markDemoSent, slugForProspect } = useProspects()
  const demoProspects = useMemo(() => prospects.filter((prospect) => !['won', 'lost'].includes(prospect.status)), [prospects])
  const routedProspect = useMemo(
    () => demoProspects.find((prospect) => slugForProspect(prospect) === slug || prospect.id === slug),
    [demoProspects, slug, slugForProspect],
  )
  const [selectedId, setSelectedId] = useState('')
  const selected = demoProspects.find((prospect) => prospect.id === selectedId) || routedProspect || demoProspects[0]

  useEffect(() => {
    if (routedProspect && routedProspect.id !== selectedId) {
      setSelectedId(routedProspect.id)
      return
    }
    if (!slug && !selectedId && demoProspects[0]) {
      setSelectedId(demoProspects[0].id)
    }
  }, [routedProspect?.id, slug, selectedId, demoProspects])

  function selectProspect(prospect) {
    setSelectedId(prospect.id)
    navigate(`/demo-builder/${slugForProspect(prospect)}`)
  }
  const [saved, setSaved] = useState('')
  const [isTutorialCollapsed, setIsTutorialCollapsed] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [checkingLive, setCheckingLive] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [generatingForge, setGeneratingForge] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [themeOverride, setThemeOverride] = useState('auto')
  const [layoutOverride, setLayoutOverride] = useState('auto')

  useEffect(() => {
    setThemeOverride(selected?.demo_theme_key || 'auto')
    setLayoutOverride(selected?.demo_layout || 'auto')
  }, [selected?.id])

  const catKey = selected ? getCategoryKey(selected) : 'local'
  const themeOptions = useMemo(() => getThemeOptions(catKey), [catKey])
  const [creativeDraft, setCreativeDraft] = useState({
    business_context: '',
    creative_direction: '',
    style_inspiration: '',
  })

  useEffect(() => {
    if (!selected) {
      setCreativeDraft({ business_context: '', creative_direction: '', style_inspiration: '' })
      return
    }
    setCreativeDraft({
      business_context: selected.business_context || '',
      creative_direction: selected.creative_direction || '',
      style_inspiration: selected.style_inspiration || '',
    })
  }, [selected?.id])

  const isCreativeDraftDirty = Boolean(selected) && (
    creativeDraft.business_context !== (selected.business_context || '') ||
    creativeDraft.creative_direction !== (selected.creative_direction || '') ||
    creativeDraft.style_inspiration !== (selected.style_inspiration || '')
  )

  async function saveCreativeDraft(message = 'Creative brief saved') {
    if (!selected) return { error: new Error('No prospect selected') }
    const result = await patch({
      business_context: creativeDraft.business_context,
      creative_direction: creativeDraft.creative_direction,
      style_inspiration: creativeDraft.style_inspiration,
    }, message)
    if (!result?.error) {
      toast.success(message)
    }
    return result
  }

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
    toast.loading('Creating a custom demo from your business context...', { id: 'ai-demo' })
    if (isCreativeDraftDirty) {
      const saveResult = await patch({
        business_context: creativeDraft.business_context,
        creative_direction: creativeDraft.creative_direction,
        style_inspiration: creativeDraft.style_inspiration,
      }, 'Creative brief saved')
      if (saveResult?.error) {
        toast.error(saveResult.error.message || 'Unable to save creative brief before generating', { id: 'ai-demo' })
        setGeneratingAi(false)
        return
      }
    }
    const result = await generateAiDemo(selected.id, creativeDraft)
    if (!result.error) {
      const provider = result.data?.generation_provider || result.data?.ai_provider
      if (provider === 'fallback') {
        toast.error('AI failed. Fallback demo created instead.', { id: 'ai-demo', duration: 7000 })
        setSaved('Fallback demo created')
      } else if (provider === 'demoforge') {
        toast.success('DemoForge site generated from the business profile', { id: 'ai-demo' })
        setSaved('DemoForge demo created')
      } else {
        toast.success(`AI-designed demo generated${provider ? ` with ${provider}` : ''}`, { id: 'ai-demo' })
        setSaved('AI demo designed')
      }
      window.setTimeout(() => setSaved(''), 1800)
    } else {
      toast.error(result.error.message || 'Unable to generate AI-designed demo', { id: 'ai-demo' })
    }
    setGeneratingAi(false)
  }

  async function generateWithForge() {
    if (!selected) return
    setGeneratingForge(true)
    toast.loading('Building DemoForge site (no AI)...', { id: 'forge-demo' })
    if (isCreativeDraftDirty) {
      const saveResult = await patch({
        business_context: creativeDraft.business_context,
        creative_direction: creativeDraft.creative_direction,
        style_inspiration: creativeDraft.style_inspiration,
      }, 'Creative brief saved')
      if (saveResult?.error) {
        toast.error(saveResult.error.message || 'Unable to save creative brief before generating', { id: 'forge-demo' })
        setGeneratingForge(false)
        return
      }
    }
    const result = await generateForgeDemo(selected.id, {
      ...creativeDraft,
      demo_theme_key: themeOverride,
      demo_layout: layoutOverride,
    })
    if (!result.error) {
      toast.success('DemoForge site generated — no AI involved', { id: 'forge-demo' })
      setSaved('DemoForge demo created')
      window.setTimeout(() => setSaved(''), 1800)
    } else {
      toast.error(result.error.message || 'Unable to generate DemoForge site', { id: 'forge-demo' })
    }
    setGeneratingForge(false)
  }

  function closeConfirmDialog() {
    setConfirmDialog(null)
  }

  function handleClearDemo() {
    if (!selected) return
    setConfirmDialog({
      title: 'Clear demo fields?',
      message: 'This removes preview URL, AI-generated HTML/CSS, research summary, and publishing status. It does not delete GitHub Pages files yet.',
      confirmLabel: 'Clear demo',
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await clearDemo(selected.id)
        if (!result.error) {
          toast.success('Demo fields cleared')
          setSaved('Demo cleared')
          window.setTimeout(() => setSaved(''), 1400)
        } else {
          toast.error(result.error.message || 'Unable to clear demo fields')
        }
      },
    })
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
          <p className="eyebrow">Phase 12</p>
          <h1>Demo Studio</h1>
          <p>Paste the same rich context you would give ChatGPT or Claude, add social links/logo notes, generate a creative demo, review it, then deploy only when it feels client-ready.</p>
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
            <h2>How to use the Demo Studio</h2>
          </div>
          <ChevronDown className={isTutorialCollapsed ? 'chevron collapsed' : 'chevron'} size={18} />
        </button>

        {!isTutorialCollapsed && (
          <div className="tutorial-steps">
            <article className="tutorial-step"><span>1</span><div><h3>Pick a prospect</h3><p>Select the business from the Demo queue. If the queue is empty, add the business on the Prospects page first.</p></div></article>
            <article className="tutorial-step"><span>2</span><div><h3>Generate the plan</h3><p>Paste Google/Instagram/Facebook context, add any creative notes, then click <strong>Generate Creative Demo</strong> to create a more client-specific page.</p></div></article>
            <article className="tutorial-step"><span>3</span><div><h3>Refine the copy</h3><p>Review the creative brief, AI research summary, generated copy, design notes, and preview before publishing.</p></div></article>
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
                  onClick={() => selectProspect(prospect)}
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

            <section className="creative-brief-card">
              <div className="creative-brief-header">
                <div>
                  <p className="eyebrow">DemoForge Engine</p>
                  <h3>Pick the look yourself — no AI involved</h3>
                  <p>DemoForge assembles the demo from your own theme/layout building blocks. Leave either on Auto to let it pick based on category and business name, or choose one directly for full control.</p>
                </div>
                <span className="status-chip">Deterministic · runs locally</span>
              </div>

              <div className="form-grid compact demoforge-controls">
                <label>Layout
                  <select value={layoutOverride} onChange={(e) => setLayoutOverride(e.target.value)}>
                    <option value="auto">Auto (pick for me)</option>
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>Theme
                  <select value={themeOverride} onChange={(e) => setThemeOverride(e.target.value)}>
                    <option value="auto">Auto (pick for me)</option>
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="card-footer-actions">
                <span className="muted-text">Category detected as "{catKey}" from the business name/category/notes — theme options above are filtered to match.</span>
                <button className="primary-button" type="button" onClick={generateWithForge} disabled={generatingForge}>
                  <Wand2 size={16} /> {generatingForge ? 'Building DemoForge site...' : 'Generate DemoForge Site'}
                </button>
              </div>
            </section>

            <style>{`
              .demoforge-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
              .demoforge-controls label { display: flex; flex-direction: column; gap: 6px; }
              .demoforge-controls select { width: 100%; }
              @media (max-width: 640px) { .demoforge-controls { grid-template-columns: 1fr; } }
            `}</style>

            <section className="creative-brief-card">
              <div className="creative-brief-header">
                <div>
                  <p className="eyebrow">Creative Brief Mode</p>
                  <h3>Give AI the same context you would paste into ChatGPT or Claude</h3>
                  <p>Use this area for raw Google Places notes, Facebook/Instagram observations, menu/services, owner notes, brand preferences, or anything that should influence the demo.</p>
                </div>
                <span className="status-chip">Review before deploy</span>
              </div>

              <div className="form-grid compact">
                <label className="span-2 tall-textarea">Business context paste box
                  <textarea
                    value={creativeDraft.business_context}
                    onChange={(e) => setCreativeDraft((current) => ({ ...current, business_context: e.target.value }))}
                    placeholder={`Paste Google Places info, Facebook/Instagram details, services, hours, reviews summary, menu, photos needed, or anything you want AI to consider for ${selected.business_name}.`}
                  />
                </label>
                <label className="span-2">Creative direction
                  <textarea
                    value={creativeDraft.creative_direction}
                    onChange={(e) => setCreativeDraft((current) => ({ ...current, creative_direction: e.target.value }))}
                    placeholder="Example: Make it feel like a bold custom auto shop site, use a darker premium look, avoid generic SaaS layouts, make it more visual and local."
                  />
                </label>
                <label className="span-2">Style inspiration / reference notes
                  <textarea
                    value={creativeDraft.style_inspiration}
                    onChange={(e) => setCreativeDraft((current) => ({ ...current, style_inspiration: e.target.value }))}
                    placeholder="Paste design inspiration, competitor links, logo notes, colors to avoid/use, or describe the vibe you want."
                  />
                </label>
              </div>
              <div className="card-footer-actions">
                {isCreativeDraftDirty ? <span className="muted-text">Unsaved creative brief changes</span> : <span className="muted-text">Creative brief saved</span>}
                <div className="button-cluster">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={!isCreativeDraftDirty}
                    onClick={() => setCreativeDraft({
                      business_context: selected.business_context || '',
                      creative_direction: selected.creative_direction || '',
                      style_inspiration: selected.style_inspiration || '',
                    })}
                  >
                    Discard
                  </button>
                  <button className="primary-button" type="button" disabled={!isCreativeDraftDirty} onClick={() => saveCreativeDraft()}>
                    Save creative brief
                  </button>
                </div>
              </div>
            </section>

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
              {selected.ai_generated_at ? <span className="status-chip">{selected.generation_provider === 'fallback' ? 'Fallback generated' : selected.generation_provider === 'demoforge' ? `DemoForge generated ${new Date(selected.ai_generated_at).toLocaleDateString()}` : `AI generated ${new Date(selected.ai_generated_at).toLocaleDateString()}`}</span> : null}
              {selected.generation_provider && selected.generation_provider !== 'fallback' ? <span className="status-chip">Provider: {selected.generation_provider}</span> : null}
            </div>

            {selected.generation_provider === 'fallback' ? (
              <div className="publishing-callout warning-callout">
                <div>
                  <strong>AI generation fell back to a static demo.</strong>
                  <p>{selected.generation_error || 'Gemini/OpenAI did not return a usable custom website. The generated preview may look more generic than expected.'}</p>
                </div>
              </div>
            ) : null}

            {selected.generation_provider === 'demoforge' ? (
              <div className="publishing-callout">
                <div>
                  <strong>DemoForge generated this site without a paid AI provider.</strong>
                  <p>The deterministic engine used the business profile, logo, category, social links, and context to create a more polished deployable demo.</p>
                </div>
              </div>
            ) : null}

            {selected.ai_research_summary ? (
              <div className="ai-research-card">
                <div>
                  <p className="eyebrow">AI Research</p>
                  <p>{selected.ai_research_summary}</p>
                </div>
                {selected.ai_source_links ? <pre>{selected.ai_source_links}</pre> : null}
              </div>
            ) : null}

            {(selected.brand_logo_url || selected.brand_profile) ? (
              <div className="brand-profile-card">
                {selected.brand_logo_url ? (
                  <img src={selected.brand_logo_url} alt={`${selected.business_name} logo`} />
                ) : (
                  <div className="brand-logo-placeholder">Logo</div>
                )}
                <div>
                  <p className="eyebrow">Brand profile</p>
                  <h3>{selected.demo_style || 'Brand-aware design'}</h3>
                  <p>AI will use the logo, palette, and design direction to create a custom page instead of reusing the same theme.</p>
                  {(selected.brand_profile?.brand_palette?.length || selected.brand_profile?.detected_colors?.length) ? (
                    <div className="color-chip-row">
                      {(selected.brand_profile.brand_palette || selected.brand_profile.detected_colors).map((color) => (
                        <span key={color} className="color-chip"><i style={{ background: color }} />{color}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="action-row">
              <button className="primary-button" type="button" onClick={generateWithAi} disabled={generatingAi}>
                <Sparkles size={16} /> {generatingAi ? 'Generating creative demo...' : 'Generate Creative Demo'}
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
              <button className="danger-button" type="button" onClick={handleClearDemo}>
                <RotateCcw size={16} /> Clear demo
              </button>
            </div>

            <div className="form-grid compact">
              <label className="span-2">Logo URL / brand image<input value={selected.brand_logo_url || ''} onChange={(e) => patch({ brand_logo_url: e.target.value })} placeholder="https://business.com/logo.png — optional, AI will also try to detect this" /></label>
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
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        tone="danger"
        onCancel={closeConfirmDialog}
        onConfirm={confirmDialog?.onConfirm}
      />
    </div>
  )
}
