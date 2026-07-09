const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function slugify(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
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

function buildSiteHtml(prospect: Record<string, unknown>) {
  const businessName = String(prospect.business_name || 'Local Business')
  const category = String(prospect.category || 'Local business')
  const phone = String(prospect.phone || '')
  const email = String(prospect.email || '')
  const instagram = String(prospect.instagram || '')
  const website = String(prospect.website || '')
  const brandProfile = prospect.brand_profile && typeof prospect.brand_profile === 'object' ? prospect.brand_profile as Record<string, unknown> : {}
  const logoUrl = String(prospect.brand_logo_url || brandProfile.logo_url || '')
  const demoCopy = String(prospect.demo_copy || '')
  const notes = demoCopy
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(businessName)} | Demo Website</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f6f3ed; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    a { color: inherit; }
    .notice { background: #172033; color: white; font-size: 14px; padding: 10px 18px; text-align: center; }
    .hero { min-height: 72vh; display: grid; place-items: center; padding: 72px 20px; background: linear-gradient(135deg, #fffaf0, #efe6d2); }
    .hero-card { width: min(1040px, 100%); display: grid; grid-template-columns: 1.1fr .9fr; gap: 32px; align-items: center; }
    .brand-logo { width: 96px; max-height: 72px; object-fit: contain; margin-bottom: 18px; background: white; border-radius: 18px; padding: 10px; box-shadow: 0 16px 42px rgba(23,32,51,.12); }
    .eyebrow { color: #9a6b2f; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: 13px; }
    h1 { font-size: clamp(42px, 7vw, 82px); line-height: .94; margin: 14px 0; letter-spacing: -0.06em; }
    p { color: #536071; font-size: 18px; line-height: 1.7; }
    .buttons { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
    .button { border-radius: 999px; padding: 14px 20px; font-weight: 800; text-decoration: none; border: 1px solid #172033; }
    .primary { background: #172033; color: white; }
    .secondary { background: white; }
    .visual { min-height: 420px; border-radius: 34px; background: radial-gradient(circle at top left, #ffffff 0, #ffffff 24%, #d6bea0 25%, #a86d39 58%, #172033 100%); box-shadow: 0 30px 90px rgba(23,32,51,.18); display: grid; place-items: end start; padding: 28px; overflow: hidden; }
    .visual strong { color: white; font-size: 30px; line-height: 1.05; max-width: 340px; }
    section { padding: 72px 20px; }
    .wrap { width: min(1040px, 100%); margin: 0 auto; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 28px; }
    .card { background: white; border: 1px solid rgba(23,32,51,.09); border-radius: 24px; padding: 24px; box-shadow: 0 18px 45px rgba(23,32,51,.07); }
    .card h3 { margin-top: 0; }
    .contact { background: #172033; color: white; border-radius: 34px; padding: 36px; display: grid; gap: 14px; }
    .contact p { color: #d6dce7; margin: 0; }
    .contact a { color: white; font-weight: 800; }
    footer { padding: 28px 20px; text-align: center; color: #667085; }
    @media (max-width: 820px) { .hero-card, .grid { grid-template-columns: 1fr; } .visual { min-height: 280px; } }
  </style>
</head>
<body>
  <div class="notice">Preview site designed for ${escapeHtml(businessName)} · demo content is placeholder · not yet live</div>
  <main>
    <section class="hero">
      <div class="hero-card">
        <div>
          ${logoUrl ? `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(businessName)} logo" />` : ''}
          <div class="eyebrow">${escapeHtml(category)}</div>
          <h1>${escapeHtml(businessName)}</h1>
          <p>A simple, modern website demo built to help local customers understand what you offer and contact you quickly.</p>
          <div class="buttons">
            ${phone ? `<a class="button primary" href="tel:${escapeHtml(phone)}">Call now</a>` : `<a class="button primary" href="#contact">Get in touch</a>`}
            <a class="button secondary" href="#services">View services</a>
          </div>
        </div>
        <div class="visual"><strong>${escapeHtml(businessName)} — clear, local, and easy to contact.</strong></div>
      </div>
    </section>

    <section id="services">
      <div class="wrap">
        <div class="eyebrow">Website plan</div>
        <h2>Built around what customers need first.</h2>
        <div class="grid">
          ${(notes.length ? notes : ['Services that are easy to scan.', 'A strong call-to-action on every page.', 'A mobile-friendly layout for local customers.']).slice(0, 3).map((item) => `<article class="card"><h3>${escapeHtml(item.split(':')[0] || 'Website section')}</h3><p>${escapeHtml(item)}</p></article>`).join('')}
        </div>
      </div>
    </section>

    <section id="contact">
      <div class="wrap contact">
        <div class="eyebrow">Contact</div>
        <h2>Ready to turn visitors into calls.</h2>
        ${phone ? `<p>Phone: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ''}
        ${email ? `<p>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ''}
        ${instagram ? `<p>Instagram: ${escapeHtml(instagram)}</p>` : ''}
        ${website ? `<p>Current website: ${escapeHtml(website)}</p>` : ''}
      </div>
    </section>
  </main>
  <footer>Demo generated by Crafted Digital Mini OS.</footer>
</body>
</html>`
}

function buildFallbackCss() {
  return `:root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f6f3ed; }
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; }
.notice { background: #172033; color: white; font-size: 14px; padding: 10px 18px; text-align: center; }
.hero { min-height: 72vh; display: grid; place-items: center; padding: 72px 20px; background: linear-gradient(135deg, #fffaf0, #efe6d2); }
.hero-card { width: min(1040px, 100%); display: grid; grid-template-columns: 1.1fr .9fr; gap: 32px; align-items: center; }
.eyebrow { color: #9a6b2f; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: 13px; }
h1 { font-size: clamp(42px, 7vw, 82px); line-height: .94; margin: 14px 0; letter-spacing: -0.06em; }
p { color: #536071; font-size: 18px; line-height: 1.7; }
.buttons { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.button { border-radius: 999px; padding: 14px 20px; font-weight: 800; text-decoration: none; border: 1px solid #172033; }
.primary { background: #172033; color: white; }
.secondary { background: white; }
.visual { min-height: 420px; border-radius: 34px; background: radial-gradient(circle at top left, #ffffff 0, #ffffff 24%, #d6bea0 25%, #a86d39 58%, #172033 100%); box-shadow: 0 30px 90px rgba(23,32,51,.18); display: grid; place-items: end start; padding: 28px; overflow: hidden; }
.visual strong { color: white; font-size: 30px; line-height: 1.05; max-width: 340px; }
section { padding: 72px 20px; }
.wrap { width: min(1040px, 100%); margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 28px; }
.card { background: white; border: 1px solid rgba(23,32,51,.09); border-radius: 24px; padding: 24px; box-shadow: 0 18px 45px rgba(23,32,51,.07); }
.card h3 { margin-top: 0; }
.contact { background: #172033; color: white; border-radius: 34px; padding: 36px; display: grid; gap: 14px; }
.contact p { color: #d6dce7; margin: 0; }
.contact a { color: white; font-weight: 800; }
footer { padding: 28px 20px; text-align: center; color: #667085; }
@media (max-width: 820px) { .hero-card, .grid { grid-template-columns: 1fr; } .visual { min-height: 280px; } }`
}

function injectStylesheetLink(html: string) {
  if (html.includes('styles.css')) return html
  if (html.includes('</head>')) return html.replace('</head>', '  <link rel="stylesheet" href="styles.css" />\n</head>')
  return html
}

async function githubRequest(path: string, options: RequestInit) {
  const token = Deno.env.get('GITHUB_TOKEN')
  if (!token) throw new Error('Missing GITHUB_TOKEN secret')

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'crafted-digital-mini-os',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new Error(body?.message || `GitHub request failed with ${response.status}`)
  }
  return body
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const { prospect } = await request.json()
    if (!prospect?.business_name) return jsonResponse({ error: 'Missing prospect business name' }, 400)

    const owner = Deno.env.get('GITHUB_OWNER')
    const repo = Deno.env.get('GITHUB_DEMOS_REPO')
    const branch = Deno.env.get('GITHUB_BRANCH') || 'main'
    const pagesBaseUrl = Deno.env.get('PAGES_BASE_URL')

    if (!owner || !repo || !pagesBaseUrl) {
      return jsonResponse({ error: 'Missing GITHUB_OWNER, GITHUB_DEMOS_REPO, or PAGES_BASE_URL secrets' }, 500)
    }

    const slug = slugify(prospect.slug || prospect.business_name)
    const htmlPath = `${slug}/index.html`
    const cssPath = `${slug}/styles.css`
    const aiHtml = typeof prospect.demo_site_html === 'string' && prospect.demo_site_html.trim().length > 200 ? prospect.demo_site_html : ''
    const aiCss = typeof prospect.demo_site_css === 'string' && prospect.demo_site_css.trim().length > 50 ? prospect.demo_site_css : ''
    const html = injectStylesheetLink(aiHtml || buildSiteHtml(prospect))
    const css = aiCss || buildFallbackCss()

    async function upsertFile(filePath: string, content: string) {
      let sha: string | undefined
      try {
        const existing = await githubRequest(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, { method: 'GET' })
        sha = existing?.sha
      } catch (error) {
        if (!String(error.message).includes('Not Found')) throw error
      }

      await githubRequest(`/repos/${owner}/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Deploy demo site for ${prospect.business_name}: ${filePath}`,
          content: encodeBase64(content),
          branch,
          ...(sha ? { sha } : {}),
        }),
      })
    }

    await upsertFile(htmlPath, html)
    await upsertFile(cssPath, css)

    const previewUrl = `${pagesBaseUrl.replace(/\/$/, '')}/${slug}/`
    return jsonResponse({ previewUrl, slug, path: htmlPath, files: [htmlPath, cssPath], aiDesigned: Boolean(aiHtml) })
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to deploy demo site' }, 500)
  }
})
