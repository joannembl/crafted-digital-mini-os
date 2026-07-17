export type DemoForgeProspect = Record<string, unknown>
export type DemoForgeSource = { title: string; link: string; snippet: string }

type DemoForgeTheme = {
  key: string
  mode: 'dark' | 'light'
  bg: string
  panel: string
  card: string
  text: string
  muted: string
  accent1: string
  accent2: string
  accent3: string
  border: string
  headingFont: string
  bodyFont: string
  heroImage: string
  icon: string
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function escapeHtml(value = '') {
  return value
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeUrl(url = '') {
  const cleaned = url.trim()
  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) return cleaned
  return `https://${cleaned}`
}

function hashString(value = '') {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function categoryKey(prospect: DemoForgeProspect) {
  const haystack = [text(prospect.category), text(prospect.business_name), text(prospect.business_context), text(prospect.notes)].join(' ').toLowerCase()
  if (/detail|detailing|wash|ceramic|polish/.test(haystack)) return 'detailing'
  if (/auto|car|garage|mechanic|repair|tire|motor|transmission|brake|tint|wrap/.test(haystack)) return 'automotive'
  if (/cafe|coffee|tea|boba|bakery|pastry|dessert/.test(haystack)) return 'cafe'
  if (/restaurant|food|taco|pizza|bar|grill|kitchen|diner/.test(haystack)) return 'restaurant'
  if (/salon|beauty|lash|brow|spa|nail|hair|skin/.test(haystack)) return 'beauty'
  if (/fitness|gym|trainer|yoga|pilates|wellness/.test(haystack)) return 'fitness'
  if (/law|legal|account|tax|consult|insurance|real estate|realtor|medical|dental/.test(haystack)) return 'professional'
  return 'local'
}

const THEMES: Record<string, DemoForgeTheme[]> = {
  automotive: [
    { key: 'track-dark', mode: 'dark', bg: '#07090d', panel: '#111827', card: '#182230', text: '#f8fafc', muted: '#a8b3c7', accent1: '#ff3d24', accent2: '#f59e0b', accent3: '#94a3b8', border: 'rgba(255,255,255,.13)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(255,61,36,.88),rgba(245,158,11,.42)), radial-gradient(circle at 80% 10%,rgba(255,255,255,.2),transparent 32%), #111827', icon: '⚙️' },
    { key: 'steel-premium', mode: 'dark', bg: '#0c1016', panel: '#151b24', card: '#1e2632', text: '#f7f9fc', muted: '#a7b0bf', accent1: '#38bdf8', accent2: '#ef4444', accent3: '#cbd5e1', border: 'rgba(255,255,255,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(56,189,248,.65),rgba(239,68,68,.45)), repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0 1px,transparent 1px 18px), #0f172a', icon: '🔧' },
    { key: 'carbon-red', mode: 'dark', bg: '#0a0a0a', panel: '#161616', card: '#1f1f1f', text: '#fbfbfb', muted: '#a3a3a3', accent1: '#e11d2e', accent2: '#fafafa', accent3: '#7f1d1d', border: 'rgba(255,255,255,.1)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'repeating-linear-gradient(45deg,rgba(225,29,46,.16) 0 2px,transparent 2px 26px), linear-gradient(135deg,#1a1a1a,#0a0a0a)', icon: '🏁' },
    { key: 'shop-blue', mode: 'light', bg: '#f4f6f8', panel: '#ffffff', card: '#e7ecf1', text: '#111827', muted: '#5b6572', accent1: '#1d4ed8', accent2: '#f97316', accent3: '#1f2937', border: 'rgba(17,24,39,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#1d4ed8,#1f2937 55%,#f97316)', icon: '🔩' },
  ],
  detailing: [
    { key: 'gloss-neon', mode: 'dark', bg: '#080812', panel: '#121322', card: '#18192b', text: '#fbfbff', muted: '#a4a7bd', accent1: '#5b83ff', accent2: '#a855f7', accent3: '#22d3ee', border: 'rgba(255,255,255,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 25% 20%,rgba(91,131,255,.75),transparent 36%), radial-gradient(circle at 80% 70%,rgba(168,85,247,.62),transparent 36%), #0b0b16', icon: '✨' },
    { key: 'clean-luxury', mode: 'light', bg: '#f8fafc', panel: '#ffffff', card: '#eef2f7', text: '#101828', muted: '#667085', accent1: '#0f172a', accent2: '#2563eb', accent3: '#06b6d4', border: 'rgba(15,23,42,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#ffffff,#dbeafe 45%,#0f172a)', icon: '💎' },
    { key: 'matte-black', mode: 'dark', bg: '#050505', panel: '#111111', card: '#1a1a1a', text: '#f5f5f5', muted: '#9c9c9c', accent1: '#d4af37', accent2: '#525252', accent3: '#e5e5e5', border: 'rgba(255,255,255,.09)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 70% 30%,rgba(212,175,55,.4),transparent 40%), #050505', icon: '🖤' },
    { key: 'pearl-white', mode: 'light', bg: '#ffffff', panel: '#fafafa', card: '#f0f0f0', text: '#161616', muted: '#6b6b6b', accent1: '#0ea5e9', accent2: '#111111', accent3: '#94a3b8', border: 'rgba(0,0,0,.1)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#ffffff,#e0f2fe 50%,#111111)', icon: '🫧' },
  ],
  cafe: [
    { key: 'warm-editorial', mode: 'light', bg: '#fff8ef', panel: '#fffdf8', card: '#f7eadb', text: '#2d1b13', muted: '#755d4d', accent1: '#8b4e2f', accent2: '#d99058', accent3: '#718355', border: 'rgba(45,27,19,.13)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 20% 20%,#fff3d8,transparent 32%), linear-gradient(135deg,#8b4e2f,#d99058 48%,#718355)', icon: '☕' },
    { key: 'espresso-sage', mode: 'dark', bg: '#1b100d', panel: '#281712', card: '#341f18', text: '#fff8ee', muted: '#d6bba7', accent1: '#c47f3f', accent2: '#7c8f62', accent3: '#f4d19b', border: 'rgba(255,248,238,.13)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(196,127,63,.88),rgba(124,143,98,.62)), #1b100d', icon: '🥐' },
    { key: 'matcha-editorial', mode: 'light', bg: '#f6f8f0', panel: '#ffffff', card: '#e7ecd9', text: '#232a1c', muted: '#5c6650', accent1: '#5c7c3f', accent2: '#c8a75d', accent3: '#2f3b23', border: 'rgba(35,42,28,.12)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 25% 20%,#eef4df,transparent 34%), linear-gradient(135deg,#5c7c3f,#c8a75d 55%)', icon: '🍵' },
  ],
  restaurant: [
    { key: 'supper-club', mode: 'dark', bg: '#160d0a', panel: '#27140f', card: '#331b14', text: '#fff7ed', muted: '#d2a896', accent1: '#dc3d2a', accent2: '#f59e0b', accent3: '#748c45', border: 'rgba(255,247,237,.13)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(220,61,42,.82),rgba(245,158,11,.55)), #27140f', icon: '🍽️' },
    { key: 'market-fresh', mode: 'light', bg: '#fbf7f0', panel: '#ffffff', card: '#f1e6d4', text: '#26201a', muted: '#6f6355', accent1: '#b3541e', accent2: '#3f6b3a', accent3: '#26201a', border: 'rgba(38,32,26,.12)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#b3541e,#f1e6d4 55%,#3f6b3a)', icon: '🌿' },
  ],
  beauty: [
    { key: 'soft-luxe', mode: 'light', bg: '#fff7f8', panel: '#ffffff', card: '#f8e7eb', text: '#30232a', muted: '#80656e', accent1: '#c08497', accent2: '#b68b5f', accent3: '#262020', border: 'rgba(48,35,42,.12)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 20% 20%,#fff,transparent 34%), linear-gradient(135deg,#c08497,#f8e7eb 48%,#b68b5f)', icon: '🌸' },
    { key: 'studio-noir', mode: 'dark', bg: '#120d10', panel: '#1e161a', card: '#291e23', text: '#fbf3f5', muted: '#c3a9b1', accent1: '#e6a4c4', accent2: '#d4af37', accent3: '#f5e6ea', border: 'rgba(251,243,245,.12)', headingFont: 'Playfair Display', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 70% 25%,rgba(230,164,196,.5),transparent 38%), #120d10', icon: '💅' },
  ],
  fitness: [
    { key: 'energy-grid', mode: 'dark', bg: '#08111f', panel: '#101b2e', card: '#17243a', text: '#f8fafc', muted: '#a6b2c7', accent1: '#84cc16', accent2: '#f97316', accent3: '#22c55e', border: 'rgba(255,255,255,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(132,204,22,.78),rgba(249,115,22,.6)), repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 44px), #101b2e', icon: '⚡' },
    { key: 'concrete-bold', mode: 'light', bg: '#f2f2f0', panel: '#ffffff', card: '#e3e3df', text: '#161616', muted: '#5c5c58', accent1: '#111111', accent2: '#e11d48', accent3: '#71717a', border: 'rgba(17,17,17,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#111111,#e11d48 60%)', icon: '🏋️' },
  ],
  professional: [
    { key: 'trust-modern', mode: 'light', bg: '#f5f7fb', panel: '#ffffff', card: '#e9eef7', text: '#102a43', muted: '#5f6f84', accent1: '#1e3a5f', accent2: '#0e7490', accent3: '#c9a84c', border: 'rgba(16,42,67,.13)', headingFont: 'Cormorant Garamond', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,#1e3a5f,#0e7490 52%,#c9a84c)', icon: '◼' },
    { key: 'ledger-dark', mode: 'dark', bg: '#0b0f14', panel: '#141a22', card: '#1c2530', text: '#f4f6f8', muted: '#9aa6b5', accent1: '#c9a84c', accent2: '#2f7d6b', accent3: '#8fa3b8', border: 'rgba(255,255,255,.1)', headingFont: 'Cormorant Garamond', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(201,168,76,.5),rgba(47,125,107,.5)), #0b0f14', icon: '◆' },
  ],
  local: [
    { key: 'crafted-local', mode: 'light', bg: '#f8f3ea', panel: '#ffffff', card: '#efe6d6', text: '#1f2937', muted: '#667085', accent1: '#0f766e', accent2: '#d97706', accent3: '#2d3142', border: 'rgba(31,41,55,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'radial-gradient(circle at 15% 20%,#fff,transparent 34%), linear-gradient(135deg,#0f766e,#d97706)', icon: '★' },
    { key: 'bold-local', mode: 'dark', bg: '#111111', panel: '#1b1b1b', card: '#242424', text: '#fafafa', muted: '#b8b8b8', accent1: '#f97316', accent2: '#14b8a6', accent3: '#fef3c7', border: 'rgba(255,255,255,.12)', headingFont: 'Space Grotesk', bodyFont: 'Inter', heroImage: 'linear-gradient(135deg,rgba(249,115,22,.8),rgba(20,184,166,.58)), #111', icon: '◆' },
  ],
}

const LAYOUTS = ['split-impact', 'editorial-stack', 'angled-feature', 'local-story']

const GALLERY_LABELS: Record<string, string[]> = {
  automotive: ['Shop exterior', 'Recent build', 'Detail shot', 'Team at work'],
  detailing: ['Before & after', 'Interior detail', 'Exterior shine', 'Happy customer'],
  cafe: ['Signature drink', 'Cozy interior', 'Menu favorite', 'Team & vibe'],
  restaurant: ['Signature dish', 'Dining room', 'Behind the scenes', 'Happy guests'],
  beauty: ['Signature service', 'Studio space', 'Before & after', 'Client results'],
  fitness: ['Training session', 'The space', 'Community moment', 'Real results'],
  professional: ['The office', 'The team', 'A client win', 'In the community'],
  local: ['Storefront', 'In action', 'Happy customers', 'Behind the scenes'],
}

function pickTheme(prospect: DemoForgeProspect) {
  const key = categoryKey(prospect)
  const options = THEMES[key] || THEMES.local
  const overrideKey = text(prospect.demo_theme_key)
  if (overrideKey && overrideKey !== 'auto') {
    const manual = options.find((theme) => theme.key === overrideKey)
      || Object.values(THEMES).flat().find((theme) => theme.key === overrideKey)
    if (manual) return manual
  }
  return options[hashString(`${text(prospect.business_name)}-${text(prospect.website)}-${text(prospect.instagram)}`) % options.length]
}

function pickLayout(prospect: DemoForgeProspect) {
  const overrideLayout = text(prospect.demo_layout)
  if (overrideLayout && overrideLayout !== 'auto' && LAYOUTS.includes(overrideLayout)) return overrideLayout
  return LAYOUTS[hashString(`${text(prospect.business_name)}-${text(prospect.address)}-${text(prospect.creative_direction)}`) % LAYOUTS.length]
}

// --- Exported helpers so the UI can offer manual theme/layout selection ---
export function getCategoryKey(prospect: DemoForgeProspect) {
  return categoryKey(prospect)
}

export function getThemeOptions(catKeyInput?: string) {
  const key = catKeyInput && THEMES[catKeyInput] ? catKeyInput : 'local'
  return THEMES[key].map((theme) => ({ value: theme.key, label: `${theme.key.replaceAll('-', ' ')} (${theme.mode})` }))
}

export const LAYOUT_OPTIONS = [
  { value: 'split-impact', label: 'Split impact — hero side-by-side, service cards' },
  { value: 'editorial-stack', label: 'Editorial stack — full hero, story-led, service list' },
  { value: 'angled-feature', label: 'Angled feature — hero + photo gallery placeholders' },
  { value: 'local-story', label: 'Local story — brand story leads before services' },
]

function servicesFromContext(prospect: DemoForgeProspect, research: Record<string, unknown>) {
  const raw = [text(prospect.demo_copy), text(prospect.business_context), text(prospect.demo_notes), text(prospect.notes), text(research.research_summary)].join('\n')
  const matches = raw
    .split(/[\n•\-]+/)
    .map((item) => item.replace(/^\s*(service|section|offer|package|menu)\s*:?\s*/i, '').trim())
    .filter((item) => item.length > 12 && item.length < 120)
    .slice(0, 5)

  if (matches.length >= 3) return matches.slice(0, 4)

  const key = categoryKey(prospect)
  const defaults: Record<string, string[]> = {
    automotive: ['Diagnostics and repair support', 'Maintenance that keeps cars moving', 'Clear estimates and honest communication', 'Fast contact for local drivers'],
    detailing: ['Exterior wash and protection', 'Interior refresh and deep cleaning', 'Paint gloss and ceramic-inspired care', 'Easy booking for busy owners'],
    cafe: ['Signature drinks and seasonal favorites', 'A warm place to meet and recharge', 'Menu highlights that are easy to browse', 'Simple directions and visit details'],
    restaurant: ['Popular dishes and menu highlights', 'Easy online contact for guests', 'Warm hospitality and local flavor', 'A clear path to visit or order'],
    beauty: ['Signature services and treatments', 'A polished first impression', 'Easy booking and client confidence', 'Soft brand experience that feels premium'],
    fitness: ['Training programs for real goals', 'Motivating coaching and community', 'Simple path to start', 'Strong calls to book a session'],
    professional: ['Clear service explanation', 'Trust-building first impression', 'Easy consultation request', 'Local expertise and responsive support'],
    local: ['Services customers can understand quickly', 'A stronger local first impression', 'Fast contact from any device', 'A website built around trust'],
  }
  return defaults[key] || defaults.local
}

function businessDescription(prospect: DemoForgeProspect, research: Record<string, unknown>) {
  const custom = text(prospect.business_context) || text(prospect.notes) || text(research.research_summary)
  if (custom) return custom.slice(0, 420)
  const category = text(prospect.category, 'local business')
  return `${text(prospect.business_name, 'This business')} is presented as a trustworthy ${category.toLowerCase()} with a polished website demo designed to help visitors understand the offer and take action quickly.`
}

function logoUrl(prospect: DemoForgeProspect, research: Record<string, unknown>) {
  const brand = (research.brand_profile && typeof research.brand_profile === 'object') ? research.brand_profile as Record<string, unknown> : {}
  return normalizeUrl(text(prospect.brand_logo_url) || text(prospect.logo_url) || text(brand.logo_url))
}

function socialLink(label: string, url: string) {
  if (!url) return ''
  const normalized = normalizeUrl(url)
  return `<a href="${escapeHtml(normalized)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
}

function contactLines(prospect: DemoForgeProspect) {
  return [
    text(prospect.phone) ? `<a href="tel:${escapeHtml(text(prospect.phone))}">${escapeHtml(text(prospect.phone))}</a>` : '',
    text(prospect.email) ? `<a href="mailto:${escapeHtml(text(prospect.email))}">${escapeHtml(text(prospect.email))}</a>` : '',
    text(prospect.address) ? `<span>${escapeHtml(text(prospect.address))}</span>` : '',
    socialLink('Instagram', text(prospect.instagram)),
    socialLink('Facebook', text(prospect.facebook)),
    socialLink('Website', text(prospect.website)),
  ].filter(Boolean)
}

function renderHeroSplit(opts: { theme: DemoForgeTheme; category: string; headline: string; subheadline: string; primaryCta: string; ctaHref: string; trustLine: string; direction: string }) {
  return `
    <section class="hero hero-split">
      <div class="hero-grid shell">
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(opts.category)} · ${escapeHtml(opts.theme.key.replaceAll('-', ' '))}</p>
          <h1>${escapeHtml(opts.headline)}</h1>
          <p class="lede">${escapeHtml(opts.subheadline)}</p>
          <div class="actions">
            <a class="button primary" href="${opts.ctaHref}">${escapeHtml(opts.primaryCta)}</a>
            <a class="button secondary" href="#services">Explore the demo</a>
          </div>
        </div>
        <aside class="feature" aria-label="Website concept visual">
          <span class="feature-kicker">${escapeHtml(opts.trustLine)}</span>
          <strong>${escapeHtml(opts.direction)}</strong>
        </aside>
      </div>
    </section>`
}

function renderHeroStacked(opts: { theme: DemoForgeTheme; category: string; headline: string; subheadline: string; primaryCta: string; ctaHref: string; trustLine: string }) {
  return `
    <section class="hero hero-stack">
      <div class="hero-stack-inner shell">
        <p class="eyebrow center">${escapeHtml(opts.category)} · ${escapeHtml(opts.theme.key.replaceAll('-', ' '))}</p>
        <h1 class="center">${escapeHtml(opts.headline)}</h1>
        <p class="lede center">${escapeHtml(opts.subheadline)}</p>
        <div class="actions center">
          <a class="button primary" href="${opts.ctaHref}">${escapeHtml(opts.primaryCta)}</a>
          <a class="button secondary" href="#services">Explore the demo</a>
        </div>
        <div class="hero-stack-band">
          <span class="feature-kicker">${escapeHtml(opts.trustLine)}</span>
        </div>
      </div>
    </section>`
}

function renderGallery(category: string) {
  const labels = GALLERY_LABELS[category] || GALLERY_LABELS.local
  const tiles = labels.map((label) => `
        <div class="gallery-tile">
          <span>${escapeHtml(label)}</span>
          <small>Photo needed</small>
        </div>`).join('')
  return `
    <section id="gallery" class="section shell gallery-section">
      <div class="section-title">
        <div><p class="eyebrow">A look inside</p><h2>Real photos go here.</h2></div>
        <p>These tiles show exactly what to send over — swap each one for a real photo before this goes live.</p>
      </div>
      <div class="gallery-grid">${tiles}</div>
    </section>`
}

function renderServicesCards(serviceCards: string) {
  return `
    <section id="services" class="section shell">
      <div class="section-title">
        <div><p class="eyebrow">What customers see first</p><h2>Clear reasons to choose this business.</h2></div>
        <p>This demo organizes the business around the decisions real visitors make: what you offer, why it matters, and how quickly they can reach you.</p>
      </div>
      <div class="cards">${serviceCards}</div>
    </section>`
}

function renderServicesList(services: string[]) {
  const rows = services.slice(0, 4).map((service, index) => `
        <div class="service-row">
          <div class="num">0${index + 1}</div>
          <div>
            <h3>${escapeHtml(service.split(':')[0].slice(0, 52))}</h3>
            <p>${escapeHtml(service)}</p>
          </div>
        </div>`).join('')
  return `
    <section id="services" class="section shell">
      <div class="section-title">
        <div><p class="eyebrow">What customers see first</p><h2>Clear reasons to choose this business.</h2></div>
        <p>Laid out as a simple, scannable list so visitors get the full picture fast.</p>
      </div>
      <div class="services-list">${rows}</div>
    </section>`
}

function renderStory(description: string, leadVariant = false) {
  return `
    <section id="story" class="section shell story ${leadVariant ? 'story-lead' : ''}">
      <div class="story-panel">
        <p class="eyebrow">Brand story</p>
        <h2>A more memorable first impression.</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="quote">
        <p>Designed to feel custom before the first sales call.</p>
      </div>
    </section>`
}

function renderContact(contactMarkup: string) {
  return `
    <section id="contact" class="section shell">
      <div class="contact">
        <div>
          <p class="eyebrow">Next step</p>
          <h2>Make it easy for visitors to act.</h2>
          <p class="lede">This preview can be updated with real photos, booking links, forms, menus, services, and launch-ready domain details.</p>
        </div>
        <div class="contact-list">${contactMarkup}</div>
      </div>
    </section>`
}

function buildCss(theme: DemoForgeTheme, layout: string) {
  const isDark = theme.mode === 'dark'
  const heroRadius = layout === 'angled-feature' ? '44px 12px 44px 12px' : layout === 'editorial-stack' ? '26px' : '34px'
  return `/* DemoForge design system: ${theme.key} / ${layout} */
:root{color-scheme:${theme.mode};--bg:${theme.bg};--panel:${theme.panel};--card:${theme.card};--text:${theme.text};--muted:${theme.muted};--a1:${theme.accent1};--a2:${theme.accent2};--a3:${theme.accent3};--line:${theme.border};--heading:"${theme.headingFont}",Georgia,serif;--body:"${theme.bodyFont}",Inter,system-ui,sans-serif;--hero:${theme.heroImage}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}.preview-bar{background:linear-gradient(90deg,var(--a1),var(--a2));color:#fff;text-align:center;font-size:13px;font-weight:800;letter-spacing:.04em;padding:10px 18px}.shell{width:min(1160px,calc(100% - 36px));margin:0 auto}.site-header{position:relative;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0}.brand{display:flex;align-items:center;gap:12px;font-family:var(--heading);font-weight:800;font-size:22px;letter-spacing:-.03em}.brand img{width:54px;height:54px;object-fit:contain;border-radius:16px;background:${isDark ? 'rgba(255,255,255,.95)' : '#fff'};padding:8px;box-shadow:0 18px 42px rgba(0,0,0,.18)}.mark{width:54px;height:54px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;font-weight:900}.nav{display:flex;gap:18px;color:var(--muted);font-weight:700;font-size:14px}.nav a:hover{color:var(--text)}.hero{padding:54px 0 78px;position:relative;overflow:hidden}.hero:before{content:"";position:absolute;inset:10% -10% auto auto;width:420px;height:420px;background:radial-gradient(circle, color-mix(in srgb,var(--a1) 38%,transparent), transparent 65%);filter:blur(4px);opacity:.9}.hero-grid{position:relative;display:grid;grid-template-columns:${layout === 'editorial-stack' ? '1fr' : '1.06fr .94fr'};gap:34px;align-items:center}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:900;color:var(--a2);margin:0 0 12px}.hero h1{font-family:var(--heading);font-size:clamp(44px,7.8vw,94px);line-height:.88;letter-spacing:-.07em;margin:0 0 18px;max-width:900px}.lede{font-size:clamp(17px,2vw,21px);color:var(--muted);max-width:680px;margin:0 0 28px}.actions{display:flex;gap:12px;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:14px 22px;font-weight:900;border:1px solid var(--line)}.button.primary{background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;border:0;box-shadow:0 20px 48px color-mix(in srgb,var(--a1) 32%,transparent)}.button.secondary{background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.88)'};color:var(--text)}.feature{min-height:390px;border-radius:${heroRadius};background:var(--hero);box-shadow:0 34px 90px rgba(0,0,0,.28);padding:28px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;position:relative}.feature:after{content:"";position:absolute;right:-80px;bottom:-80px;width:240px;height:240px;border:1px solid rgba(255,255,255,.38);border-radius:50%}.feature-kicker{align-self:flex-start;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px}.feature strong{position:relative;color:#fff;font-family:var(--heading);font-size:clamp(30px,4.4vw,52px);line-height:.95;max-width:520px}.section{padding:74px 0}.section-title{display:grid;grid-template-columns:0.8fr 1.2fr;gap:28px;align-items:end;margin-bottom:28px}.section-title h2{font-family:var(--heading);font-size:clamp(32px,5vw,62px);line-height:.95;letter-spacing:-.06em;margin:0}.section-title p{color:var(--muted);font-size:18px;margin:0}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.card{background:linear-gradient(180deg,color-mix(in srgb,var(--card) 92%,#fff 8%),var(--card));border:1px solid var(--line);border-radius:24px;padding:24px;min-height:230px;box-shadow:0 22px 48px rgba(0,0,0,.12)}.card .num{font-family:var(--heading);font-size:42px;color:var(--a2);line-height:1}.card h3{font-family:var(--heading);font-size:22px;line-height:1.02;margin:18px 0 10px}.card p{color:var(--muted);margin:0}.story{display:grid;grid-template-columns:1fr 1fr;gap:18px}.story-panel{background:var(--panel);border:1px solid var(--line);border-radius:32px;padding:34px}.story-panel h2{font-family:var(--heading);font-size:clamp(34px,5vw,66px);line-height:.93;margin:0 0 16px}.story-panel p{color:var(--muted);font-size:18px}.quote{background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;border-radius:32px;padding:34px;display:flex;flex-direction:column;justify-content:flex-end;min-height:320px}.quote p{font-family:var(--heading);font-size:clamp(28px,4vw,48px);line-height:.98;margin:0;color:#fff}.contact{background:var(--panel);border:1px solid var(--line);border-radius:36px;padding:34px;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center}.contact h2{font-family:var(--heading);font-size:clamp(34px,5vw,64px);line-height:.93;margin:0}.contact-list{display:grid;gap:12px}.contact-list a,.contact-list span{display:flex;align-items:center;justify-content:space-between;gap:12px;background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.78)'};border:1px solid var(--line);border-radius:16px;padding:14px 16px;font-weight:800;color:var(--text);overflow-wrap:anywhere}footer{padding:30px 0 42px;color:var(--muted);text-align:center}.center{text-align:center;margin-left:auto;margin-right:auto}.actions.center{justify-content:center}.hero-stack-inner{position:relative;padding-top:10px}.hero-stack-inner h1{margin-left:auto;margin-right:auto}.hero-stack-band{margin-top:36px;border-radius:${heroRadius};background:var(--hero);min-height:220px;display:flex;align-items:flex-end;padding:24px;box-shadow:0 34px 90px rgba(0,0,0,.28)}.gallery-section{padding-top:0}.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.gallery-tile{aspect-ratio:4/3;border-radius:20px;border:1px dashed var(--line);background:linear-gradient(160deg,color-mix(in srgb,var(--a1) 14%,var(--panel)),color-mix(in srgb,var(--a2) 10%,var(--panel)));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:12px}.gallery-tile span{font-weight:800;font-size:14px}.gallery-tile small{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.services-list{display:grid;gap:14px}.service-row{display:grid;grid-template-columns:56px 1fr;gap:16px;align-items:start;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:18px 20px}.service-row .num{font-family:var(--heading);font-size:26px;color:var(--a2)}.service-row h3{margin:0 0 6px;font-family:var(--heading);font-size:19px}.service-row p{margin:0;color:var(--muted)}.story-lead .story-panel{order:0}@media(max-width:920px){.hero-grid,.section-title,.story,.contact{grid-template-columns:1fr}.cards,.gallery-grid{grid-template-columns:repeat(2,1fr)}.nav{display:none}.feature{min-height:290px}}@media(max-width:620px){.shell{width:min(100% - 28px,1160px)}.site-header{padding:16px 0}.cards,.gallery-grid{grid-template-columns:1fr}.hero{padding-top:32px}.card{min-height:auto}.contact{padding:24px}.brand{font-size:18px}.brand img,.mark{width:44px;height:44px}.feature strong{font-size:32px}.service-row{grid-template-columns:1fr}}`
}

export function generateDemoForgeSite({ prospect, research = {}, sources = [] }: { prospect: DemoForgeProspect; research?: Record<string, unknown>; sources?: DemoForgeSource[] }) {
  const name = text(prospect.business_name, 'Local Business')
  const category = text(prospect.category, 'Local business')
  const theme = pickTheme(prospect)
  const layout = pickLayout(prospect)
  const logo = logoUrl(prospect, research)
  const services = servicesFromContext(prospect, research)
  const description = businessDescription(prospect, research)
  const contacts = contactLines(prospect)
  const place = (research.google_place && typeof research.google_place === 'object') ? research.google_place as Record<string, unknown> : {}
  const rating = numberValue(place.rating) || numberValue(prospect.google_rating)
  const reviewCount = numberValue(place.reviewCount) || numberValue(prospect.google_review_count)
  const direction = text(prospect.creative_direction) || text(prospect.style_inspiration) || `${theme.key} ${layout}`
  const headline = text(prospect.demo_brief) || `${name} deserves a website as polished as the work.`
  const subheadline = description.length > 230 ? `${description.slice(0, 230)}…` : description
  const primaryCta = text(prospect.phone) ? 'Call now' : 'Get in touch'
  const safeName = escapeHtml(name)
  const ctaHref = text(prospect.phone) ? `tel:${escapeHtml(text(prospect.phone))}` : '#contact'
  const serviceCards = services.slice(0, 4).map((service, index) => `
        <article class="card">
          <div class="num">0${index + 1}</div>
          <h3>${escapeHtml(service.split(':')[0].slice(0, 52))}</h3>
          <p>${escapeHtml(service)}</p>
        </article>`).join('')
  const contactMarkup = contacts.length ? contacts.map((item) => item).join('\n') : '<span>Add real phone, email, booking, or social links before launch.</span>'
  const trustLine = rating ? `${rating.toFixed(1)} star Google profile${reviewCount ? ` · ${reviewCount} reviews` : ''}` : 'Built around trust, clarity, and fast contact.'
  const catKey = categoryKey(prospect)

  // Each layout assembles a genuinely different section order/composition,
  // not just a CSS tweak, so demos from the same category still read differently.
  let bodySections = ''
  if (layout === 'editorial-stack') {
    bodySections = [
      renderHeroStacked({ theme, category, headline, subheadline, primaryCta, ctaHref, trustLine }),
      renderStory(description, true),
      renderServicesList(services),
      renderContact(contactMarkup),
    ].join('\n')
  } else if (layout === 'angled-feature') {
    bodySections = [
      renderHeroSplit({ theme, category, headline, subheadline, primaryCta, ctaHref, trustLine, direction }),
      renderGallery(catKey),
      renderServicesCards(serviceCards),
      renderContact(contactMarkup),
    ].join('\n')
  } else if (layout === 'local-story') {
    bodySections = [
      renderHeroSplit({ theme, category, headline, subheadline, primaryCta, ctaHref, trustLine, direction }),
      renderStory(description),
      renderServicesCards(serviceCards),
      renderContact(contactMarkup),
    ].join('\n')
  } else {
    // split-impact (default)
    bodySections = [
      renderHeroSplit({ theme, category, headline, subheadline, primaryCta, ctaHref, trustLine, direction }),
      renderServicesCards(serviceCards),
      renderStory(description),
      renderContact(contactMarkup),
    ].join('\n')
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} | Demo Website</title>
  <meta name="description" content="Preview demo website concept for ${safeName}." />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="preview-bar">Preview site designed for ${safeName} · demo content is placeholder · not yet live</div>
  <header class="site-header shell">
    <a class="brand" href="#top" aria-label="${safeName} home">
      ${logo ? `<img src="${escapeHtml(logo)}" alt="${safeName} logo" />` : `<span class="mark">${escapeHtml(theme.icon)}</span>`}
      <span>${safeName}</span>
    </a>
    <nav class="nav" aria-label="Main navigation">
      <a href="#services">Services</a>
      <a href="#story">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main id="top">
${bodySections}
  </main>

  <footer class="shell">Demo generated by Crafted Digital Mini OS · DemoForge Engine</footer>
</body>
</html>`

  const css = buildCss(theme, layout)
  return {
    research_summary: text(research.research_summary) || `${name} demo generated with DemoForge using the saved business profile and any available Google Places or website context.`,
    brand_profile: {
      ...((research.brand_profile && typeof research.brand_profile === 'object') ? research.brand_profile as Record<string, unknown> : {}),
      logo_url: logo,
      design_direction: `${theme.key} / ${layout}`,
      brand_palette: [theme.bg, theme.panel, theme.accent1, theme.accent2, theme.accent3],
      source: 'demoforge_engine',
    },
    hero_headline: headline,
    hero_subheadline: subheadline,
    primary_cta: primaryCta,
    secondary_cta: 'Explore the demo',
    sections: services.slice(0, 4).map((service) => ({ title: service.split(':')[0].slice(0, 52), body: service })),
    about: description,
    contact_prompt: 'Make it easy for visitors to call, message, book, or request a quote.',
    design_notes: `DemoForge selected ${theme.key} with ${layout} for ${category}.`,
    designed_site: {
      html,
      css,
      summary: `DemoForge ${theme.key} ${layout} single-page demo with logo support, custom palette, and responsive sections.`,
      style_direction: `${theme.key} / ${layout}`,
    },
    sources,
    ai_provider: 'demoforge',
    generation_provider: 'demoforge',
    generation_error: '',
  }
}
