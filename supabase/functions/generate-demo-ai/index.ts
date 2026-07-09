const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Prospect = Record<string, string | null | undefined>
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

    return { url: websiteUrl, title, metaDescription, headings, paragraphs, bodyText }
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
  ].filter(Boolean)
  return lines.join(' ')
}

function fallbackDemo(prospect: Prospect, researchSummary: string, sources: Source[]) {
  const name = prospect.business_name || 'Local Business'
  const category = prospect.category || 'local business'
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
    <a class="logo" href="#">${safeName}</a>
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

  const css = `:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f2ea}*{box-sizing:border-box}body{margin:0}a{color:inherit}.preview-bar{background:#111827;color:white;text-align:center;padding:10px 18px;font-size:14px}.site-header{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px min(6vw,64px);background:rgba(247,242,234,.82);backdrop-filter:blur(16px);position:sticky;top:0;z-index:10}.logo{font-weight:900;text-decoration:none;font-size:20px}nav{display:flex;gap:18px}nav a{text-decoration:none;color:#536071;font-weight:700}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:center;padding:82px min(6vw,64px)}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:#a05a1c;font-weight:900}.hero h1{font-size:clamp(42px,7vw,86px);line-height:.94;letter-spacing:-.07em;margin:12px 0}.hero p,.split p,.cta p{font-size:19px;line-height:1.7;color:#536071}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button{border-radius:999px;padding:14px 22px;text-decoration:none;font-weight:900;border:1px solid #172033}.primary{background:#172033;color:#fff}.secondary{background:#fff}.hero-card{min-height:420px;border-radius:36px;padding:32px;display:grid;align-content:end;gap:16px;background:radial-gradient(circle at 20% 20%,#fff 0 16%,#f3c27c 17% 38%,#d96d37 39% 62%,#172033 63%);box-shadow:0 32px 80px rgba(23,32,51,.18);color:#fff}.hero-card span{font-weight:900;text-transform:uppercase;letter-spacing:.12em}.hero-card strong{font-size:34px;line-height:1.05}.section,.split,.cta{padding:74px min(6vw,64px)}.section h2,.split h2,.cta h2{font-size:clamp(30px,4vw,52px);letter-spacing:-.04em;margin:10px 0}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}.cards article{background:white;border:1px solid rgba(23,32,51,.08);border-radius:28px;padding:26px;box-shadow:0 18px 40px rgba(23,32,51,.07)}.cards h3{margin-top:0}.split{display:grid;grid-template-columns:.9fr 1.1fr;gap:32px;background:white}.cta{margin:min(6vw,64px);border-radius:36px;background:#172033;color:white}.cta p{color:#d7deea}footer{text-align:center;padding:32px;color:#667085}@media(max-width:820px){.site-header{align-items:flex-start;flex-direction:column}.hero,.split,.cards{grid-template-columns:1fr}.hero-card{min-height:300px}.cta{margin:20px}}`

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
  const styleDirection = prospect.design_style || prospect.demo_style || 'modern polished local business website'
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
    sources,
    instructions: [
      'Create a complete polished demo website for a local website agency preview site.',
      'Use only the provided prospect info, Google Places data, and website content. Do not invent exact claims, awards, prices, hours, addresses, reviews, or services unless provided.',
      'Do not quote reviews. You may summarize broad public facts from the research.',
      'The public website must include a visible preview disclaimer near the top: Preview site designed for [Business Name] · demo content is placeholder · not yet live.',
      'Return valid JSON only. Do not wrap the response in markdown.',
      'Required top-level keys: research_summary, hero_headline, hero_subheadline, primary_cta, secondary_cta, sections, about, contact_prompt, design_notes, designed_site, sources.',
      'sections must be an array of 3 to 6 objects with title and body.',
      'designed_site must be an object with keys: html, css, summary, style_direction.',
      'designed_site.html must be a complete HTML document that links to styles.css using <link rel="stylesheet" href="styles.css">.',
      'designed_site.css must be complete responsive CSS for the page.',
      'Make the design visually strong, modern, responsive, and tailored to the business category. Avoid a plain generic template.',
      'Use semantic sections, strong hero layout, service/menu cards, about/trust section, contact CTA, and footer.',
      'Do not include external JavaScript, tracking scripts, external images, or remote fonts.',
      'Use CSS gradients, shapes, cards, spacing, and typography to make the demo look premium even without photos.',
      'sources must be an array of objects with title, link, snippet from the sources used.',
    ],
  }
}

async function generateWithGemini(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return null

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash'
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
                'You are a careful website strategist creating safe, high-converting demo website copy for local businesses.',
                'Return JSON only. Do not wrap the response in markdown.',
                JSON.stringify(prompt),
              ].join('\n\n'),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
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
        { role: 'system', content: 'You are a careful website strategist creating safe, high-converting demo website copy for local businesses.' },
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
    const research = {
      provider: 'google_places',
      research_summary: researchSummary,
      google_place: places.place,
      website_content: website,
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
