const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { generateDemoForgeSite } from '../_shared/demo-forge.ts'

type Prospect = Record<string, unknown>
type Source = { title: string; link: string; snippet: string }

async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return { user: null, response: jsonResponse({ error: 'Unauthorized' }, 401) }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, response: jsonResponse({ error: 'Missing Supabase auth environment' }, 500) }
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  })

  if (!userResponse.ok) {
    return { user: null, response: jsonResponse({ error: 'Invalid or expired session' }, 401) }
  }

  const user = await userResponse.json().catch(() => null)
  if (!user?.id) return { user: null, response: jsonResponse({ error: 'Invalid session' }, 401) }
  return { user, response: null }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function cleanText(value = '') {
  return value.toString().replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

function truncate(value = '', max = 4500) {
  const cleaned = cleanText(value)
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned
}

function safeJsonParse(value: string) {
  if (!value) return null

  const attempts: string[] = []
  const raw = value.trim()
  attempts.push(raw)

  // Gemini/OpenAI sometimes wrap JSON in markdown fences even when told not to.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  if (fenced) attempts.push(fenced)

  // Sometimes a model adds a sentence before/after the JSON. Extract the largest object.
  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) attempts.push(raw.slice(firstBrace, lastBrace + 1))

  for (const attempt of attempts) {
    try { return JSON.parse(attempt) } catch { /* try next */ }
  }

  return null
}

function summarizeGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown generation error')
  return message.length > 900 ? `${message.slice(0, 900)}…` : message
}

function validateGeneratedSite(generated: Record<string, unknown> | null) {
  const site = generated?.designed_site as Record<string, unknown> | undefined
  const html = typeof site?.html === 'string' ? site.html.trim() : ''
  const css = typeof site?.css === 'string' ? site.css.trim() : ''

  if (!html || html.length < 700) return 'AI response did not include enough HTML.'
  if (!css || css.length < 400) return 'AI response did not include enough CSS.'
  if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) return 'AI HTML was not a complete HTML document.'
  if (!/styles\.css/i.test(html)) return 'AI HTML did not link to styles.css.'

  return ''
}

function normalizeUrl(url = '') {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}


function resolveUrl(url = '', base = '') {
  if (!url) return ''
  const cleaned = url.trim()
  if (cleaned.startsWith('data:')) return ''
  try {
    return new URL(cleaned, base || undefined).toString()
  } catch {
    return normalizeUrl(cleaned)
  }
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}


function hashString(value = '') {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash) + value.charCodeAt(i)
  return Math.abs(hash)
}

const categoryPalettes: Record<string, string[][]> = {
  cafe: [
    ['#4b2e1f', '#c47f3f', '#f6ead7', '#7c8f62', '#211713'],
    ['#2f241d', '#b85c38', '#fff1dd', '#d2a55f', '#5f7f69'],
    ['#3e2b23', '#8b5e3c', '#f7efe4', '#b86b4b', '#2f5d50'],
  ],
  restaurant: [
    ['#5c1f1b', '#c84630', '#fff3df', '#6f7d3c', '#211a16'],
    ['#2e241f', '#a63d2a', '#f6dfb9', '#857346', '#171717'],
  ],
  automotive: [
    ['#111827', '#e11d48', '#f59e0b', '#e5e7eb', '#020617'],
    ['#151515', '#d72638', '#a5b4c3', '#f5f5f0', '#2b2d42'],
    ['#0b0f14', '#ff5a1f', '#cbd5e1', '#111827', '#f8fafc'],
  ],
  beauty: [
    ['#2b2024', '#d8a7b1', '#fff2f5', '#b68b5f', '#f7dfe6'],
    ['#241a1f', '#c48b9f', '#f9e8dd', '#8c6a57', '#fffaf7'],
  ],
  fitness: [
    ['#0f172a', '#84cc16', '#f97316', '#f8fafc', '#1f2937'],
    ['#101820', '#f2aa4c', '#f7f7f2', '#4b5563', '#000000'],
  ],
  professional: [
    ['#102a43', '#2f80ed', '#f4efe6', '#64748b', '#0f172a'],
    ['#1f2937', '#0e7490', '#f5f1e8', '#94a3b8', '#111827'],
  ],
  luxury: [
    ['#09090b', '#c6a15b', '#fffaf0', '#3f3f46', '#18181b'],
    ['#111111', '#bfa46f', '#f7f0df', '#544936', '#000000'],
  ],
  default: [
    ['#1f2937', '#0f766e', '#f7f3e8', '#d97706', '#111827'],
    ['#212529', '#2a9d8f', '#f4f1de', '#e76f51', '#264653'],
    ['#2d3142', '#ef8354', '#f5f0e6', '#4f5d75', '#111827'],
  ],
}

const designDirections = [
  'asymmetrical editorial landing page with magazine-style typography',
  'bold conversion-focused homepage with diagonal hero panels',
  'premium boutique layout with oversized whitespace and refined cards',
  'warm neighborhood website with layered paper textures and organic shapes',
  'high-energy promo page with split hero, stat blocks, and strong CTAs',
  'minimal modern local business site with strong grid, sticky CTA, and calm palette',
  'story-driven homepage with timeline-style sections and large quote block',
  'visual-first brand page with floating cards, rounded panels, and unique section order',
]

function categoryKey(value = '') {
  const text = value.toLowerCase()
  if (/cafe|coffee|tea|bakery|boba/.test(text)) return 'cafe'
  if (/restaurant|food|taco|pizza|bar|grill/.test(text)) return 'restaurant'
  if (/auto|car|garage|detail|mechanic|tint|wrap|repair|motors/.test(text)) return 'automotive'
  if (/beauty|salon|lash|brow|spa|nail|hair/.test(text)) return 'beauty'
  if (/gym|fitness|trainer|yoga|pilates/.test(text)) return 'fitness'
  if (/luxury|jewelry|boutique|estate/.test(text)) return 'luxury'
  if (/law|account|consult|real estate|insurance|medical|dental/.test(text)) return 'professional'
  return 'default'
}

function chooseBrandPalette(prospect: Prospect, detectedColors: string[]) {
  const cleanDetected = uniqueValues(detectedColors || []).filter((color) => /^#[0-9a-f]{3,6}$/i.test(color)).slice(0, 5)
  if (cleanDetected.length >= 2) return cleanDetected
  const key = categoryKey([prospect.category, prospect.business_name, prospect.notes].filter(Boolean).join(' '))
  const options = categoryPalettes[key] || categoryPalettes.default
  return options[hashString(`${prospect.business_name || ''}-${prospect.category || ''}`) % options.length]
}

function chooseDesignDirection(prospect: Prospect) {
  const existing = (prospect.design_direction || prospect.demo_style || '').toString().trim()
  if (existing && !/modern clean|brand-aware design|modern polished local business website/i.test(existing)) return existing
  const seed = `${prospect.business_name || ''}-${prospect.category || ''}-${prospect.website || ''}`
  return designDirections[hashString(seed) % designDirections.length]
}

function extractHexColors(html = '') {
  const matches = Array.from(html.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)).map((match) => match[0].toLowerCase())
  const ignored = new Set(['#fff', '#ffffff', '#000', '#000000', '#111', '#111111', '#222', '#222222', '#333', '#333333', '#f5f5f5', '#f7f7f7', '#fafafa'])
  const counts = new Map<string, number>()
  for (const color of matches) {
    if (ignored.has(color)) continue
    counts.set(color, (counts.get(color) || 0) + 1)
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([color]) => color).slice(0, 6)
}

function extractLogoUrl(html = '', websiteUrl = '') {
  const candidates: string[] = []

  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ]
  for (const pattern of metaPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) candidates.push(match[1])
  }

  const linkMatches = Array.from(html.matchAll(/<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi))
  for (const match of linkMatches) candidates.push(match[1])

  const imgMatches = Array.from(html.matchAll(/<img[^>]+>/gi))
  for (const match of imgMatches) {
    const tag = match[0]
    const src = tag.match(/src=["']([^"']+)["']/i)?.[1] || ''
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] || ''
    const className = tag.match(/class=["']([^"']*)["']/i)?.[1] || ''
    const id = tag.match(/id=["']([^"']*)["']/i)?.[1] || ''
    const signal = `${src} ${alt} ${className} ${id}`.toLowerCase()
    if (src && /logo|brand|site-title|header-logo/.test(signal)) candidates.unshift(src)
  }

  const resolved = uniqueValues(candidates.map((candidate) => resolveUrl(candidate, websiteUrl)))
  return resolved.find((url) => /\.(png|jpe?g|webp|svg|gif|ico)(\?|#|$)/i.test(url)) || resolved[0] || ''
}

function buildBrandProfile(prospect: Prospect, places: Awaited<ReturnType<typeof lookupGooglePlace>>, website: Awaited<ReturnType<typeof scrapeWebsite>>) {
  const manualLogo = prospect.logo_url || prospect.brand_logo_url || ''
  const logoUrl = normalizeUrl(manualLogo) || website?.logoUrl || ''
  const detectedColors = uniqueValues([
    ...((website?.brandColors as string[] | undefined) || []),
  ]).slice(0, 6)
  const brandPalette = chooseBrandPalette(prospect, detectedColors)
  const designDirection = chooseDesignDirection(prospect)
  const placeType = places.place?.type || prospect.category || 'local business'
  const websiteTitle = website?.title || ''
  const designSeed = hashString(`${prospect.business_name || ''}-${placeType}-${logoUrl}-${brandPalette.join('-')}`)
  const styleHints = [
    `Business type: ${placeType}`,
    websiteTitle ? `Website title: ${websiteTitle}` : '',
    logoUrl ? 'Use the discovered/manual logo as a visible brand anchor.' : 'No logo was discovered; create a distinctive typography-based brand mark.',
    detectedColors.length ? `Detected colors from website/assets: ${detectedColors.join(', ')}` : 'No reliable colors detected from a logo/site.',
    `Required brand palette: ${brandPalette.join(', ')}`,
    `Required design direction: ${designDirection}`,
    `Design seed: ${designSeed}. Use this to make this site visually different from other generated demos.`,
  ].filter(Boolean)

  return {
    logo_url: logoUrl,
    detected_colors: detectedColors,
    brand_palette: brandPalette,
    business_type: placeType,
    design_direction: designDirection,
    design_seed: designSeed,
    style_hints: styleHints,
    source: logoUrl ? 'website_or_manual_logo' : detectedColors.length ? 'website_colors' : 'category_palette',
  }
}

async function lookupGooglePlace(prospect: Prospect) {
  const key = Deno.env.get('GOOGLE_PLACES_API_KEY')
  if (!key) return { provider: 'places_not_configured', place: null, sources: [] as Source[] }

  const query = [
    prospect.business_name,
    prospect.category,
    prospect.address,
    prospect.city,
    prospect.state,
    prospect.website,
    prospect.instagram,
    prospect.facebook,
  ].filter(Boolean).join(' ')

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.googleMapsUri',
        'places.rating',
        'places.userRatingCount',
        'places.businessStatus',
        'places.primaryTypeDisplayName',
        'places.regularOpeningHours.weekdayDescriptions',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places lookup failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  const place = data.places?.[0] || null
  if (!place) return { provider: 'google_places', place: null, sources: [] as Source[] }

  const displayName = place.displayName?.text || prospect.business_name || 'Business listing'
  const address = place.formattedAddress || ''
  const phone = place.nationalPhoneNumber || ''
  const website = place.websiteUri || ''
  const mapsUrl = place.googleMapsUri || ''
  const rating = place.rating ? `${place.rating} stars` : ''
  const reviewCount = place.userRatingCount ? `${place.userRatingCount} reviews` : ''
  const type = place.primaryTypeDisplayName?.text || ''
  const hours = place.regularOpeningHours?.weekdayDescriptions?.join('; ') || ''

  const snippet = cleanText([
    type,
    address,
    phone,
    rating,
    reviewCount,
    hours ? `Hours: ${hours}` : '',
  ].filter(Boolean).join(' · '))

  return {
    provider: 'google_places',
    place: { displayName, address, phone, website, mapsUrl, rating: place.rating || null, reviewCount: place.userRatingCount || null, type, hours },
    sources: [{ title: `Google Places: ${displayName}`, link: mapsUrl || website || '', snippet }],
  }
}

async function scrapeWebsite(url = '') {
  const websiteUrl = normalizeUrl(url)
  if (!websiteUrl) return null

  try {
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'CraftedDigitalMiniOS/1.0 (+https://joannembl.github.io/crafted-digital-mini-os/)' },
      redirect: 'follow',
    })
    if (!response.ok) return { url: websiteUrl, error: `Website returned ${response.status}` }

    const html = await response.text()
    const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
    const metaDescription = cleanText(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '')
    const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)).slice(0, 12).map((match) => cleanText(match[1])).filter(Boolean)
    const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).slice(0, 18).map((match) => cleanText(match[1])).filter((text) => text.length > 20)
    const bodyText = truncate([title, metaDescription, ...headings, ...paragraphs].filter(Boolean).join('\n'), 5000)
    const logoUrl = extractLogoUrl(html, websiteUrl)
    const brandColors = extractHexColors(html)

    return { url: websiteUrl, title, metaDescription, headings, paragraphs, bodyText, logoUrl, brandColors }
  } catch (error) {
    return { url: websiteUrl, error: error.message || 'Unable to scrape website' }
  }
}

function buildResearchSummary(prospect: Prospect, places: Awaited<ReturnType<typeof lookupGooglePlace>>, website: Awaited<ReturnType<typeof scrapeWebsite>>) {
  const place = places.place
  const lines = [
    place ? `Google Places found ${place.displayName || prospect.business_name}.` : 'No Google Places match was found.',
    place?.type ? `Category/type: ${place.type}.` : '',
    place?.address ? `Address: ${place.address}.` : '',
    place?.phone ? `Phone: ${place.phone}.` : '',
    place?.rating ? `Rating: ${place.rating} from ${place.reviewCount || 0} reviews.` : '',
    place?.hours ? `Hours found from Google Places.` : '',
    website?.bodyText ? `Website content was reviewed from ${website.url}.` : website?.error ? `Website scrape issue: ${website.error}.` : 'No website content was available to review.',
    website?.logoUrl ? `Logo detected from website: ${website.logoUrl}.` : '',
    Array.isArray(website?.brandColors) && website.brandColors.length ? `Brand colors detected: ${website.brandColors.join(', ')}.` : '',
  ].filter(Boolean)
  return lines.join(' ')
}

function fallbackDemo(prospect: Prospect, researchSummary: string, sources: Source[]) {
  const name = prospect.business_name || 'Local Business'
  const category = prospect.category || 'local business'
  const brandProfile = (prospect.brand_profile && typeof prospect.brand_profile === 'object') ? prospect.brand_profile as Record<string, unknown> : {}
  const logoUrl = (prospect.brand_logo_url || brandProfile.logo_url || '').toString()
  const safeName = name.replace(/[<>&]/g, '')
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} | Demo Website</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="preview-bar">Preview site designed for ${safeName} · demo content is placeholder · not yet live</div>
  <header class="site-header">
    <a class="logo" href="#">${logoUrl ? `<img src="${logoUrl}" alt="${safeName} logo" />` : ''}<span>${safeName}</span></a>
    <nav><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
  </header>
  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${category}</p>
        <h1>${safeName} — a polished local website demo</h1>
        <p>A modern, mobile-friendly preview designed to help customers understand your services and contact you quickly.</p>
        <div class="actions"><a class="button primary" href="#contact">Get in touch</a><a class="button secondary" href="#services">View services</a></div>
      </div>
      <div class="hero-card"><span>Modern preview</span><strong>Built to turn visitors into calls, messages, and bookings.</strong></div>
    </section>
    <section id="services" class="section"><p class="eyebrow">Services</p><h2>Everything customers need to know at a glance.</h2><div class="cards"><article><h3>Clear services</h3><p>Easy-to-scan cards explain what you offer.</p></article><article><h3>Local trust</h3><p>Prominent contact details and credibility cues help visitors feel confident.</p></article><article><h3>Fast contact</h3><p>Simple calls-to-action make it easy to reach out.</p></article></div></section>
    <section id="about" class="split"><div><p class="eyebrow">About</p><h2>A stronger first impression online.</h2></div><p>${safeName} is presented as a trustworthy local ${category.toLowerCase()} with a clean, professional website experience.</p></section>
    <section id="contact" class="cta"><p class="eyebrow">Contact</p><h2>Ready to turn visitors into customers?</h2><p>This demo can be customized with real photos, services, booking, forms, and colors.</p></section>
  </main>
  <footer>Demo generated by Crafted Digital Mini OS.</footer>
</body>
</html>`

  const css = `:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f2ea}*{box-sizing:border-box}body{margin:0}a{color:inherit}.preview-bar{background:#111827;color:white;text-align:center;padding:10px 18px;font-size:14px}.site-header{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px min(6vw,64px);background:rgba(247,242,234,.82);backdrop-filter:blur(16px);position:sticky;top:0;z-index:10}.logo{font-weight:900;text-decoration:none;font-size:20px;display:flex;align-items:center;gap:10px}.logo img{width:44px;height:44px;object-fit:contain;border-radius:12px;background:white;padding:4px}nav{display:flex;gap:18px}nav a{text-decoration:none;color:#536071;font-weight:700}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:center;padding:82px min(6vw,64px)}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:#a05a1c;font-weight:900}.hero h1{font-size:clamp(42px,7vw,86px);line-height:.94;letter-spacing:-.07em;margin:12px 0}.hero p,.split p,.cta p{font-size:19px;line-height:1.7;color:#536071}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button{border-radius:999px;padding:14px 22px;text-decoration:none;font-weight:900;border:1px solid #172033}.primary{background:#172033;color:#fff}.secondary{background:#fff}.hero-card{min-height:420px;border-radius:36px;padding:32px;display:grid;align-content:end;gap:16px;background:radial-gradient(circle at 20% 20%,#fff 0 16%,#f3c27c 17% 38%,#d96d37 39% 62%,#172033 63%);box-shadow:0 32px 80px rgba(23,32,51,.18);color:#fff}.hero-card span{font-weight:900;text-transform:uppercase;letter-spacing:.12em}.hero-card strong{font-size:34px;line-height:1.05}.section,.split,.cta{padding:74px min(6vw,64px)}.section h2,.split h2,.cta h2{font-size:clamp(30px,4vw,52px);letter-spacing:-.04em;margin:10px 0}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}.cards article{background:white;border:1px solid rgba(23,32,51,.08);border-radius:28px;padding:26px;box-shadow:0 18px 40px rgba(23,32,51,.07)}.cards h3{margin-top:0}.split{display:grid;grid-template-columns:.9fr 1.1fr;gap:32px;background:white}.cta{margin:min(6vw,64px);border-radius:36px;background:#172033;color:white}.cta p{color:#d7deea}footer{text-align:center;padding:32px;color:#667085}@media(max-width:820px){.site-header{align-items:flex-start;flex-direction:column}.hero,.split,.cards{grid-template-columns:1fr}.hero-card{min-height:300px}.cta{margin:20px}}`

  return {
    research_summary: researchSummary || 'Generated from the prospect details only.',
    hero_headline: `${name} — a cleaner way to show up online`,
    hero_subheadline: `A modern demo website for a ${category.toLowerCase()} that makes services easy to understand and gives customers a quick path to call, message, or book.`,
    primary_cta: prospect.phone ? 'Call Now' : 'Request a Quote',
    secondary_cta: 'View Services',
    sections: [
      { title: 'Services', body: `Clear service cards help customers quickly understand what ${name} offers.` },
      { title: 'Why choose us', body: 'Local, friendly, and easy to contact from any device.' },
      { title: 'Get started', body: 'A simple call-to-action turns visitors into calls, messages, or bookings.' },
    ],
    about: `${name} is presented as a trustworthy local ${category.toLowerCase()} with a clean, mobile-friendly online presence.`,
    contact_prompt: `Ready to reach ${name}? Use the call, email, or message buttons to get started.`,
    design_notes: 'Use a clean modern layout, strong hero section, simple cards, visible contact buttons, and a preview disclaimer.',
    designed_site: {
      html,
      css,
      summary: 'Fallback polished single-page demo with custom CSS and responsive sections.',
      style_direction: 'Modern clean',
    },
    sources,
  }
}

function buildAiPrompt(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const brandProfile = research.brand_profile || {}
  const styleDirection = (brandProfile as Record<string, unknown>).design_direction || prospect.design_direction || prospect.demo_style || chooseDesignDirection(prospect)
  const palette = (brandProfile as Record<string, unknown>).brand_palette || chooseBrandPalette(prospect, [])
  const designSeed = (brandProfile as Record<string, unknown>).design_seed || hashString(`${prospect.business_name || ''}-${Date.now()}`)

  return {
    prospect: {
      business_name: prospect.business_name,
      category: prospect.category,
      owner_name: prospect.owner_name,
      phone: prospect.phone,
      email: prospect.email,
      website: prospect.website,
      instagram: prospect.instagram,
      facebook: prospect.facebook,
      address: prospect.address,
      notes: prospect.notes,
      demo_notes: prospect.demo_notes,
      business_context: prospect.business_context,
      creative_direction: prospect.creative_direction,
      style_inspiration: prospect.style_inspiration,
      style_direction: styleDirection,
    },
    research,
    brand_profile: brandProfile,
    required_palette: palette,
    required_design_direction: styleDirection,
    design_seed: designSeed,
    sources,
    instructions: [
      'You are not filling in a template. You are the visual web designer and front-end developer for this specific local business demo.',
      'Treat prospect.business_context, prospect.creative_direction, and prospect.style_inspiration as the primary creative brief, the same way a human designer would use pasted Google Places, Facebook, Instagram, and notes.',
      'Take creative liberties with layout, visual hierarchy, section order, tone, and page composition while staying truthful to provided information.',
      'Generate a complete custom one-page website, not just copy. The website must feel designed specifically for this client and business type.',
      'Use only the provided prospect info, raw business context, Google Places data, and website content. Do not invent exact claims, awards, prices, hours, addresses, reviews, or services unless provided.',
      'Do not quote reviews. You may summarize broad public facts from the research.',
      'The public website must include a visible preview disclaimer near the top: Preview site designed for [Business Name] · demo content is placeholder · not yet live.',
      'Return valid JSON only. Do not wrap the response in markdown.',
      'Required top-level keys: research_summary, brand_profile, hero_headline, hero_subheadline, primary_cta, secondary_cta, sections, about, contact_prompt, design_notes, designed_site, sources.',
      'sections must be an array of 3 to 6 objects with title and body.',
      'designed_site must be an object with keys: html, css, summary, style_direction.',
      'designed_site.html must be a complete HTML document that links to styles.css using <link rel="stylesheet" href="styles.css">.',
      'designed_site.css must be complete responsive CSS for the page.',
      `Mandatory palette: ${Array.isArray(palette) ? palette.join(', ') : palette}. Use these colors as CSS variables and as the dominant visual system.`,
      `Mandatory design direction: ${styleDirection}.`,
      `Design variation seed: ${designSeed}. Use this seed to choose unique section order, hero composition, card style, decorative shapes, spacing rhythm, and CTA treatment.`,
      'Do NOT use the same generic centered hero + three cards + CTA footer layout. Avoid the default blue/purple/indigo SaaS gradient unless those colors are in the mandatory palette.',
      'Do NOT use #172033, #a05a1c, #f7f2ea, or the same navy/orange fallback palette unless those exact colors appear in the mandatory palette.',
      'Use a client-specific layout: change nav style, hero shape, section order, background treatments, card shape, borders, and CTA placement based on the business.',
      'If brand_profile.logo_url exists, use it as a visible logo in the header/hero with an absolute image URL. This is the only external image allowed.',
      'If there is no logo, create a distinctive text-based wordmark using CSS only.',
      'Use semantic sections, strong hero layout, service/menu cards, about/trust section, contact CTA, and footer, but vary their visual structure and order. If the pasted business context suggests a menu, gallery, booking, custom automotive, detail package, cafe menu, or social-forward layout, design around that instead of a generic services grid.',
      'Do not include external JavaScript, tracking scripts, remote fonts, or external images except the provided logo URL.',
      'Use CSS gradients, shapes, cards, spacing, typography, pseudo-elements, and responsive layout to make the demo look premium even without photos.',
      'The CSS must be specific to this business. Include CSS custom properties for palette colors and a short comment naming the design direction.',
      'sources must be an array of objects with title, link, snippet from the sources used.',
    ],
  }
}

async function generateWithGemini(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return null

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
  const prompt = buildAiPrompt(prospect, research, sources)

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'You are a senior creative web designer and front-end developer creating client-ready local business demo websites. Return JSON only with fully custom HTML and CSS.',
                'Return JSON only. Do not wrap the response in markdown.',
                JSON.stringify(prompt),
              ].join('\n\n'),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed: ${errorText}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason || ''
  const outputText = candidate?.content?.parts?.map((part: Record<string, string>) => part.text || '').join('') || ''

  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini response was cut off because it hit max output tokens. Try again or simplify the business research.')
  }

  const parsed = safeJsonParse(outputText || '')
  if (!parsed) throw new Error(`Gemini did not return valid JSON. Raw response started with: ${outputText.slice(0, 220)}`)

  const validationError = validateGeneratedSite(parsed)
  if (validationError) throw new Error(`Gemini generated an unusable site: ${validationError}`)

  return { ...parsed, sources: Array.isArray(parsed.sources) ? parsed.sources : sources, ai_provider: 'gemini', generation_provider: 'gemini', generation_error: '' }
}

async function generateWithOpenAI(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const prompt = buildAiPrompt(prospect, research, sources)

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'You are a senior creative web designer and front-end developer creating client-ready local business demo websites. Return JSON only with fully custom HTML and CSS.' },
        { role: 'user', content: JSON.stringify(prompt) },
      ],
      max_output_tokens: 8192,
      text: { format: { type: 'json_object' } },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${errorText}`)
  }

  const data = await response.json()
  if (data.status === 'incomplete') {
    throw new Error(`OpenAI response was incomplete: ${JSON.stringify(data.incomplete_details || {})}`)
  }

  const outputText = data.output_text || data.output?.flatMap((item: Record<string, unknown>) => item.content || [])?.map((part: Record<string, string>) => part.text || '').join('')
  const parsed = safeJsonParse(outputText || '')
  if (!parsed) throw new Error(`OpenAI did not return valid JSON. Raw response started with: ${(outputText || '').slice(0, 220)}`)

  const validationError = validateGeneratedSite(parsed)
  if (validationError) throw new Error(`OpenAI generated an unusable site: ${validationError}`)

  return { ...parsed, sources: Array.isArray(parsed.sources) ? parsed.sources : sources, ai_provider: 'openai', generation_provider: 'openai', generation_error: '' }
}

async function generateDemoContent(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const preferredProvider = (Deno.env.get('AI_PROVIDER') || 'gemini').toLowerCase()
  const errors: string[] = []

  const tryGemini = async () => {
    try { return await generateWithGemini(prospect, research, sources) }
    catch (error) { errors.push(summarizeGenerationError(error)); return null }
  }

  const tryOpenAI = async () => {
    try { return await generateWithOpenAI(prospect, research, sources) }
    catch (error) { errors.push(summarizeGenerationError(error)); return null }
  }

  let generated = preferredProvider === 'openai' ? await tryOpenAI() : await tryGemini()
  if (!generated) generated = preferredProvider === 'openai' ? await tryGemini() : await tryOpenAI()
  if (generated) return { ...generated, ai_errors: errors }

  const demoForgeSite = generateDemoForgeSite({ prospect, research, sources })
  return {
    ...demoForgeSite,
    ai_errors: errors,
    generation_error: errors.length ? errors.join(' | ') : '',
    fallback_reason: errors.length ? errors.join(' | ') : 'No live AI provider was configured or available. DemoForge generated the site locally.',
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const authCheck = await requireAuthenticatedUser(request)
  if (authCheck.response) return authCheck.response

  try {
    const { prospect } = await request.json()
    if (!prospect?.business_name) return jsonResponse({ error: 'Missing prospect business name' }, 400)

    const places = await lookupGooglePlace(prospect)
    const websiteUrl = places.place?.website || prospect.website || ''
    const website = await scrapeWebsite(websiteUrl)
    const placesSources = places.sources || []
    const websiteSource = website?.bodyText ? [{ title: `Website: ${website.title || website.url}`, link: website.url || '', snippet: truncate(website.metaDescription || website.bodyText || '', 260) }] : []
    const sources = [...placesSources, ...websiteSource]
    const researchSummary = buildResearchSummary(prospect, places, website)
    const brandProfile = buildBrandProfile(prospect, places, website)
    const research = {
      provider: 'google_places',
      research_summary: researchSummary,
      google_place: places.place,
      website_content: website,
      brand_profile: brandProfile,
      sources,
    }

    const generated = await generateDemoContent(prospect, research, sources)

    return jsonResponse({
      generated,
      research,
      researchProvider: places.provider,
      searched: Boolean(places.place || website?.bodyText),
    })
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to generate demo with AI' }, 500)
  }
})
