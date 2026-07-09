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
    sources,
  }
}

function buildAiPrompt(prospect: Prospect, research: Record<string, unknown>, sources: Source[]) {
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
    },
    research,
    sources,
    instructions: [
      'Create demo website content for a local website agency preview site.',
      'Use only the provided prospect info, Google Places data, and website content. Do not invent exact claims, awards, prices, hours, addresses, reviews, or services unless provided.',
      'Do not quote reviews. You may summarize broad public facts from the research.',
      'Make it polished but clearly safe for a demo website.',
      'Return valid JSON only with keys: research_summary, hero_headline, hero_subheadline, primary_cta, secondary_cta, sections, about, contact_prompt, design_notes, sources.',
      'sections must be an array of 3 to 5 objects with title and body.',
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
