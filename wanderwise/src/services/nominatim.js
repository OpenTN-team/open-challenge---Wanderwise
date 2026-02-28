// Nominatim (OpenStreetMap) geocoding — free, no API key
const BASE = 'https://nominatim.openstreetmap.org'

export async function searchCities(query, limit = 8) {
  if (!query || query.length < 2) return []
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&accept-language=en&featuretype=city`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WanderWise/1.0 (tourism-hackathon)' },
  })
  if (!res.ok) throw new Error('Nominatim search failed')
  const data = await res.json()
  return data.map((r) => ({
    placeId: r.place_id,
    name: r.address?.city || r.address?.town || r.address?.village || r.name,
    displayName: r.display_name,
    country: r.address?.country || '',
    countryCode: r.address?.country_code?.toUpperCase() || '',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    type: r.type,
  }))
}

export async function reverseGeocode(lat, lng) {
  const url = `${BASE}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WanderWise/1.0' },
  })
  if (!res.ok) return null
  return res.json()
}
