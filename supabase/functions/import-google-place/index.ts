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

function titleCase(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim()
}

function categoryFromTypes(types: string[] = []) {
  const preferred = types.find((type) => ![
    'point_of_interest',
    'establishment',
    'store',
    'food',
  ].includes(type))
  return titleCase(preferred || types[0] || '')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
  if (!apiKey) return jsonResponse({ error: 'Missing GOOGLE_PLACES_API_KEY secret' }, 500)

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const businessName = String(body.business_name || body.businessName || '').trim()
  const address = String(body.address || '').trim()
  const query = String(body.query || [businessName, address].filter(Boolean).join(' ')).trim()

  if (!query) return jsonResponse({ error: 'Missing business name or address' }, 400)

  const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.googleMapsUri',
        'places.rating',
        'places.userRatingCount',
        'places.types',
        'places.primaryType',
        'places.regularOpeningHours.weekdayDescriptions',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      languageCode: 'en',
    }),
  })

  const result = await placesResponse.json().catch(() => ({}))

  if (!placesResponse.ok) {
    return jsonResponse({
      error: `Google Places request failed: ${JSON.stringify(result).slice(0, 800)}`,
    }, placesResponse.status)
  }

  const place = Array.isArray(result.places) ? result.places[0] : null
  if (!place) return jsonResponse({ error: 'No matching Google Places business found' }, 404)

  const types = Array.isArray(place.types) ? place.types : []
  const openingHours = Array.isArray(place.regularOpeningHours?.weekdayDescriptions)
    ? place.regularOpeningHours.weekdayDescriptions
    : []

  const business = {
    business_name: place.displayName?.text || businessName,
    address: place.formattedAddress || address,
    phone: place.nationalPhoneNumber || '',
    website: place.websiteUri || '',
    category: categoryFromTypes([place.primaryType, ...types].filter(Boolean)),
    google_place_id: place.id || '',
    google_maps_url: place.googleMapsUri || '',
    google_rating: typeof place.rating === 'number' ? place.rating : null,
    google_review_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    google_types: types,
    google_opening_hours: openingHours,
    google_imported_at: new Date().toISOString(),
  }

  return jsonResponse({ business, raw: place })
})
