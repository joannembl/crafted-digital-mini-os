const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Prospect = Record<string, unknown>
type Source = { title: string; link: string; snippet: string }

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
  try { return JSON.parse(value) } catch { return null }
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
    ['#22201b', '#e0a458', '#faf3e6', '#5f7161', '#151311'],
    ['#3a2e2a', '#e8846b', '#fbf0e3', '#6f8f8c', '#1c1613'],
    ['#26211c', '#c9a15a', '#f4ede0', '#8f5c4e', '#100d0a'],
  ],
  restaurant: [
    ['#5c1f1b', '#c84630', '#fff3df', '#6f7d3c', '#211a16'],
    ['#2e241f', '#a63d2a', '#f6dfb9', '#857346', '#171717'],
    ['#3d1414', '#e0763e', '#fdf1e0', '#4c6b4f', '#1a1010'],
    ['#241c1a', '#d94f4f', '#f7e9d7', '#3f7d6b', '#120e0d'],
  ],
  automotive: [
    ['#111827', '#e11d48', '#f59e0b', '#e5e7eb', '#020617'],
    ['#151515', '#d72638', '#a5b4c3', '#f5f5f0', '#2b2d42'],
    ['#0b0f14', '#ff5a1f', '#cbd5e1', '#111827', '#f8fafc'],
    ['#141414', '#00b4d8', '#e5e5e5', '#ffb703', '#0a0a0a'],
  ],
  beauty: [
    ['#2b2024', '#d8a7b1', '#fff2f5', '#b68b5f', '#f7dfe6'],
    ['#241a1f', '#c48b9f', '#f9e8dd', '#8c6a57', '#fffaf7'],
    ['#1f1418', '#e6b8c2', '#fdf4f0', '#a97c50', '#f2e0d5'],
    ['#2a1d22', '#c99b7a', '#faeee6', '#9c6b7a', '#fef7f4'],
  ],
  fitness: [
    ['#0f172a', '#84cc16', '#f97316', '#f8fafc', '#1f2937'],
    ['#101820', '#f2aa4c', '#f7f7f2', '#4b5563', '#000000'],
    ['#181818', '#39ff88', '#f5f5f5', '#ff3b3b', '#0d0d0d'],
    ['#12172b', '#00e0d3', '#f4f4f4', '#ff7a00', '#05070f'],
  ],
  professional: [
    ['#102a43', '#2f80ed', '#f4efe6', '#64748b', '#0f172a'],
    ['#1f2937', '#0e7490', '#f5f1e8', '#94a3b8', '#111827'],
    ['#1a2238', '#6c63ff', '#f6f4f0', '#7a8699', '#0e1220'],
    ['#0d1b2a', '#3a86ff', '#f2efe9', '#8d99ae', '#060c14'],
  ],
  luxury: [
    ['#09090b', '#c6a15b', '#fffaf0', '#3f3f46', '#18181b'],
    ['#111111', '#bfa46f', '#f7f0df', '#544936', '#000000'],
    ['#151312', '#a67c52', '#f9f5ec', '#4a4238', '#0a0908'],
  ],
  default: [
    ['#1f2937', '#0f766e', '#f7f3e8', '#d97706', '#111827'],
    ['#212529', '#2a9d8f', '#f4f1de', '#e76f51', '#264653'],
    ['#2d3142', '#ef8354', '#f5f0e6', '#4f5d75', '#111827'],
    ['#1c1f26', '#5e60ce', '#f2ede4', '#e29578', '#0f1115'],
  ],
}

// Structural axes are chosen independently in code (not left to the AI to invent),
// so variety comes from combinatorics rather than hoping the model interprets a seed.
// 8 heroes x 6 navs x 8 section orders x 6 cards x 6 motifs x 5 CTAs x 5 type pairs
// = tens of thousands of distinct combinations, spread across every category.
const heroLayouts = [
  'split hero: headline + CTA on the left, large diagonal-clipped image panel on the right',
  'full-bleed hero with centered oversized wordmark and a thin nav bar overlaid on top',
  'asymmetric hero: oversized stacked headline on the left third, small floating stat/quote card on the right',
  'top-left corner logo mark only, hero fills the full viewport with large centered CTA',
  'magazine hero: large pull-quote style headline beside a small grid of accent thumbnails',
  'split hero with a vertical divider line and an offset stat block bottom-right',
  'layered hero with angled color-block shapes behind a left-aligned text block',
  'minimal hero: giant typography only, no imagery, single centered CTA pill',
]

const navStyles = [
  'sticky top nav, logo left, links right, rounded pill CTA button',
  'centered logo nav with links split evenly left and right of it',
  'vertical nav rail on desktop that collapses to a hamburger on mobile',
  'bottom-fixed floating pill nav bar',
  'transparent nav over the hero that solidifies with a shadow on scroll',
  'minimal text-only nav with no background and wide letter-spacing',
]

const sectionOrderOptions = [
  ['hero', 'services', 'about', 'gallery', 'testimonial', 'contact'],
  ['hero', 'about', 'services', 'contact'],
  ['hero', 'gallery', 'services', 'about', 'contact'],
  ['hero', 'services', 'testimonial', 'about', 'contact'],
  ['hero', 'about', 'gallery', 'services', 'testimonial', 'contact'],
  ['hero', 'testimonial', 'services', 'about', 'contact'],
  ['hero', 'services', 'about', 'contact'],
  ['hero', 'gallery', 'about', 'services', 'contact'],
]

const cardStyles = [
  'rounded cards with soft drop shadow',
  'flat bordered cards, no shadow, sharp corners',
  'asymmetric masonry cards with varying heights',
  'numbered list style with oversized index numbers instead of card containers',
  'image-forward cards with a color-tint overlay and bottom-aligned text',
  'no card containers at all — a clean divider-line list with generous spacing',
]

const decorativeMotifs = [
  'soft organic blob shapes bleeding behind the hero',
  'thin geometric line accents in the corners of sections',
  'a subtle halftone dot texture panel behind one section',
  'diagonal color-block section transitions instead of straight edges',
  'oversized typographic quotation marks used as a decorative accent',
  'no decoration — rely entirely on whitespace, type scale, and the palette',
]

const ctaStyles = [
  'solid pill primary button + ghost/outline secondary button',
  'underlined text link paired with one solid button',
  'full-width color banner CTA strip between sections',
  'floating sticky CTA button pinned bottom-right on scroll',
  'large bordered CTA card with an arrow icon, not a button',
]

const typographyPairings = [
  'serif display headline paired with a clean sans-serif body',
  'condensed bold sans headline paired with a regular-weight sans body',
  'all-caps tracked-out headline paired with a light-weight body',
  'italic serif accent headline paired with a clean sans body',
  'monospace accent labels/eyebrows paired with a sans headline and body',
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

// Pick from a list using a hash salted with `axis`, so each structural axis is
// chosen independently -- two cafes landing on the same hero layout won't also
// land on the same nav, cards, motif, etc.
function seededPick<T>(items: T[], seedBase: string, axis: string) {
  return items[hashString(`${seedBase}::${axis}`) % items.length]
}

function chooseBrandPalette(prospect: Prospect, detectedColors: string[]) {
  const cleanDetected = uniqueValues(detectedColors || []).filter((color) => /^#[0-9a-f]{3,6}$/i.test(color)).slice(0, 5)
  if (cleanDetected.length >= 2) return cleanDetected
  const key = categoryKey([prospect.category, prospect.business_name, prospect.notes].filter(Boolean).join(' '))
  const options = categoryPalettes[key] || categoryPalettes.default
  const seedBase = `${prospect.business_name || ''}-${prospect.category || ''}`
  return seededPick(options, seedBase, 'palette')
}

function chooseDesignSystem(prospect: Prospect) {
  const existing = (prospect.design_direction || prospect.demo_style || '').toString().trim()
  // A manually-edited style note from the user overrides the generated system entirely.
  const looksGenerated = /^Hero:.*Nav:.*Cards:/s.test(existing)
  if (existing && !looksGenerated && !/modern clean|brand-aware design|modern polished local business website/i.test(existing)) {
    return {
      summary: existing,
      custom: true,
      heroLayout: '',
      navStyle: '',
      sectionOrder: [] as string[],
      cardStyle: '',
      decorativeMotif: '',
      ctaStyle: '',
      typographyPairing: '',
    }
  }

  const seedBase = `${prospect.business_name || ''}-${prospect.category || ''}-${prospect.website || ''}`
  const heroLayout = seededPick(heroLayouts, seedBase, 'hero')
  const navStyle = seededPick(navStyles, seedBase, 'nav')
  const sectionOrder = seededPick(sectionOrderOptions, seedBase, 'sections')
  const cardStyle = seededPick(cardStyles, seedBase, 'cards')
  const decorativeMotif = seededPick(decorativeMotifs, seedBase, 'motif')
  const ctaStyle = seededPick(ctaStyles, seedBase, 'cta')
  const typographyPairing = seededPick(typographyPairings, seedBase, 'type')

  const summary = [
    `Hero: ${heroLayout}.`,
    `Nav: ${navStyle}.`,
    `Section order: ${sectionOrder.join(' -> ')}.`,
    `Cards: ${cardStyle}.`,
    `Motif: ${decorativeMotif}.`,
    `CTA: ${ctaStyle}.`,
    `Type: ${typographyPairing}.`,
  ].join(' ')

  return {
    summary,
    custom: false,
    heroLayout,
    navStyle,
    sectionOrder,
    cardStyle,
    decorativeMotif,
    ctaStyle,
    typographyPairing,
  }
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
  const designSystem = chooseDesignSystem(prospect)
  const placeType = places.place?.type || prospect.category || 'local business'
  const websiteTitle = website?.title || ''
  const designSeed = hashString(`${prospect.business_name || ''}-${placeType}-${logoUrl}-${brandPalette.join('-')}`)
  const styleHints = [
    `Business type: ${placeType}`,
    websiteTitle ? `Website title: ${websiteTitle}` : '',
    logoUrl ? 'Use the discovered/manual logo as a visible brand anchor.' : 'No logo was discovered; create a distinctive typography-based brand mark.',
    detectedColors.length ? `Detected colors from website/assets: ${detectedColors.join(', ')}` : 'No reliable colors detected from a logo/site.',
    `Required brand palette: ${brandPalette.join(', ')}`,
    `Required layout system: ${designSystem.summary}`,
  ].filter(Boolean)

  return {
    logo_url: logoUrl,
    detected_colors: detectedColors,
    brand_palette: brandPalette,
    business_type: placeType,
    design_direction: designSystem.summary,
    design_system: designSystem,
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
    prospect.city,
    prospect.state,
    prospect.website,
    prospect.instagram,
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
  const brandProfile = (research.brand_profile || {}) as Record<string, unknown>
  const designSystem = (brandProfile.design_system as ReturnType<typeof chooseDesignSystem>) || chooseDesignSystem(prospect)
  const styleDirection = designSystem.summary
  const palette = (brandProfile.brand_palette as string[]) || chooseBrandPalette(prospect, [])
  const designSeed = (brandProfile.design_seed as number) || hashString(`${prospect.business_name || ''}-${Date.now()}`)

  const layoutRequirements = designSystem.custom
    ? [`Design direction (set manually, follow it exactly): ${styleDirection}`]
    : [
        `Hero layout (required, do not substitute): ${designSystem.heroLayout}`,
        `Navigation style (required): ${designSystem.navStyle}`,
        `Section order (required, top to bottom): ${(designSystem.sectionOrder as string[]).join(' -> ')}`,
        `Card/list style (required): ${designSystem.cardStyle}`,
        `Decorative motif (required): ${designSystem.decorativeMotif}`,
        `CTA style (required): ${designSystem.ctaStyle}`,
        `Typography pairing (required): ${designSystem.typographyPairing}`,
      ]

  return {
    prospect: {
      business_name: prospect.business_name,
      category: prospect.category,
      owner_name: prospect.owner_name,
      phone: prospect.phone,
      email: prospect.email,
      website: prospect.website,
      instagram: prospect.instagram,
      notes: prospect.notes,
      demo_notes: prospect.demo_notes,
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
      'Generate a complete custom one-page website, not just copy. The website must feel designed specifically for this client and business type.',
      'Use only the provided prospect info, Google Places data, and website content. Do not invent exact claims, awards, prices, hours, addresses, reviews, or services unless provided.',
      'Do not quote reviews. You may summarize broad public facts from the research.',
      'The public website must include a visible preview disclaimer near the top: Preview site designed for [Business Name] · demo content is placeholder · not yet live.',
      'Return valid JSON only. Do not wrap the response in markdown.',
      'Required top-level keys: research_summary, brand_profile, hero_headline, hero_subheadline, primary_cta, secondary_cta, sections, about, contact_prompt, design_notes, designed_site, sources.',
      'sections must be an array of 3 to 6 objects with title and body.',
      'designed_site must be an object with keys: html, css, summary, style_direction.',
      'designed_site.html must be a complete HTML document that links to styles.css using <link rel="stylesheet" href="styles.css">.',
      'designed_site.css must be complete responsive CSS for the page.',
      `Mandatory palette: ${Array.isArray(palette) ? palette.join(', ') : palette}. Use these colors as CSS variables and as the dominant visual system.`,
      ...layoutRequirements,
      'The seven requirements above (hero, nav, section order, cards, motif, CTA, type) are not suggestions -- follow each one exactly as written. This is what makes this demo different from every other demo you generate.',
      'Do NOT use the same generic centered hero + three cards + CTA footer layout. Avoid the default blue/purple/indigo SaaS gradient unless those colors are in the mandatory palette.',
      'Do NOT use #172033, #a05a1c, #f7f2ea, or the same navy/orange fallback palette unless those exact colors appear in the mandatory palette.',
      'If brand_profile.logo_url exists, use it as a visible logo in the header/hero with an absolute image URL. This is the only external image allowed.',
      'If there is no logo, create a distinctive text-based wordmark using CSS only.',
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
                'You are a senior brand-aware web designer and front-end developer. Return JSON only with fully custom HTML and CSS.',
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
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed: ${errorText}`)
  }

  const data = await response.json()
  const outputText = data.candidates?.[0]?.content?.parts?.map((part: Record<string, string>) => part.text || '').join('') || ''
  const parsed = safeJsonParse(outputText || '')
  if (!parsed) throw new Error('Gemini did not return valid JSON')
  return { ...parsed, sources: Array.isArray(parsed.sources) ? parsed.sources : sources, ai_provider: 'gemini' }
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
        { role: 'system', content: 'You are a senior brand-aware web designer and front-end developer. Return JSON only with fully custom HTML and CSS.' },
        { role: 'user', content: JSON.stringify(prompt) },
      ],
      text: { format: { type: 'json_object' } },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${errorText}`)
  }

  const data = await response.json()
  const outputText = data.output_text || data.output?.flatMap((item: Record<string, unknown>) => item.content || [])?.map((part: Record<string, string>) => part.text || '').join('')
  const parsed = safeJsonParse(outputText || '')
  if (!parsed) throw new Error('OpenAI did not return valid JSON')
  return { ...parsed, sources: Array.isArray(parsed.sources) ? parsed.sources : sources, ai_provider: 'openai' }
}

async function generateDemoContent(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const preferredProvider = (Deno.env.get('AI_PROVIDER') || 'gemini').toLowerCase()
  const errors: string[] = []

  const tryGemini = async () => {
    try { return await generateWithGemini(prospect, research, sources) }
    catch (error) { errors.push(error.message || 'Gemini failed'); return null }
  }

  const tryOpenAI = async () => {
    try { return await generateWithOpenAI(prospect, research, sources) }
    catch (error) { errors.push(error.message || 'OpenAI failed'); return null }
  }

  let generated = preferredProvider === 'openai' ? await tryOpenAI() : await tryGemini()
  if (!generated) generated = preferredProvider === 'openai' ? await tryGemini() : await tryOpenAI()
  if (generated) return { ...generated, ai_errors: errors }

  return { ...fallbackDemo(prospect, research.research_summary as string, sources), ai_provider: 'fallback', ai_errors: errors }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

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
