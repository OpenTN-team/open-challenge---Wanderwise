// Overpass API — OSM data for tourism POIs, heritage sites — free, no key
const BASE = 'https://overpass-api.de/api/interpreter'

// Fetch tourism POIs around a location
export async function fetchTourismPOIs(lat, lng, radiusKm = 15, limit = 30) {
  const r = radiusKm * 1000 // meters
  const query = `
    [out:json][timeout:15];
    (
      node["tourism"](around:${r},${lat},${lng});
      node["historic"](around:${r},${lat},${lng});
      node["heritage"](around:${r},${lat},${lng});
    );
    out body ${limit};
  `
  const res = await fetch(BASE, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error('Overpass query failed')
  const data = await res.json()
  return data.elements.map((el) => ({
    id: el.id,
    lat: el.lat,
    lng: el.lon,
    name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed',
    type: el.tags?.tourism || el.tags?.historic || el.tags?.heritage || 'poi',
    description: el.tags?.description || el.tags?.['description:en'] || '',
    wikipedia: el.tags?.wikipedia || '',
    wikidata: el.tags?.wikidata || '',
    website: el.tags?.website || '',
    openingHours: el.tags?.opening_hours || '',
    image: el.tags?.image || '',
    tags: el.tags || {},
  }))
}

// Fetch UNESCO World Heritage sites in a bounding box or radius
export async function fetchHeritageSites(lat, lng, radiusKm = 200) {
  const r = radiusKm * 1000
  const query = `
    [out:json][timeout:20];
    (
      node["heritage"="1"](around:${r},${lat},${lng});
      node["heritage:operator"="whc"](around:${r},${lat},${lng});
      node["historic"="heritage"](around:${r},${lat},${lng});
      way["heritage"="1"](around:${r},${lat},${lng});
      relation["heritage"="1"](around:${r},${lat},${lng});
      node["tourism"="museum"](around:${r},${lat},${lng});
      node["historic"="monument"](around:${r},${lat},${lng});
      node["historic"="castle"](around:${r},${lat},${lng});
      node["historic"="archaeological_site"](around:${r},${lat},${lng});
      node["historic"="ruins"](around:${r},${lat},${lng});
    );
    out body 40;
  `
  const res = await fetch(BASE, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error('Heritage query failed')
  const data = await res.json()
  return data.elements
    .filter((el) => el.lat && el.lon)
    .map((el) => ({
      id: el.id,
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      name: el.tags?.name || el.tags?.['name:en'] || 'Heritage Site',
      type: categorizeHeritage(el.tags),
      historicType: el.tags?.historic || '',
      heritage: el.tags?.heritage || '',
      wikipedia: el.tags?.wikipedia || '',
      wikidata: el.tags?.wikidata || '',
      website: el.tags?.website || '',
      description: el.tags?.description || el.tags?.['description:en'] || '',
      image: el.tags?.image || '',
      yearBuilt: el.tags?.start_date || el.tags?.['year_of_construction'] || '',
      tags: el.tags || {},
    }))
}

// Count POIs by type in an area (for sustainability/tourism intensity scoring)
export async function countTourismDensity(lat, lng, radiusKm = 10) {
  const r = radiusKm * 1000
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"](around:${r},${lat},${lng});
      node["shop"="souvenir"](around:${r},${lat},${lng});
      node["amenity"="restaurant"](around:${r},${lat},${lng});
    );
    out count;
  `
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.elements?.[0]?.tags?.total || 0
  } catch {
    return null
  }
}

function categorizeHeritage(tags) {
  if (!tags) return 'other'
  if (tags.historic === 'castle' || tags.historic === 'fort' || tags.castle) return 'architecture'
  if (tags.historic === 'archaeological_site' || tags.historic === 'ruins') return 'archaeological'
  if (tags.tourism === 'museum') return 'museum'
  if (tags.historic === 'monument' || tags.historic === 'memorial') return 'monument'
  if (tags.amenity === 'place_of_worship' || tags.building === 'mosque' || tags.building === 'church' || tags.building === 'temple') return 'religious'
  if (tags.heritage === '1' || tags['heritage:operator'] === 'whc') return 'world_heritage'
  return 'historic'
}
