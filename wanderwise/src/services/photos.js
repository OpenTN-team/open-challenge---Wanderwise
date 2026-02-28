/**
 * photos.js — Real place photo service using Wikimedia Commons & Wikipedia
 * No API key needed. Returns real CC-licensed photos of actual places worldwide.
 *
 * Priority chain:
 *  1. Wikimedia Commons search (high-res, real landmark/city shots)
 *  2. Wikipedia article page image (reliable fallback)
 *  3. null (caller handles its own fallback)
 */

const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const WIKI    = 'https://en.wikipedia.org/w/api.php'

/**
 * Fetch one high-quality real photo for a named place.
 * @param {string} placeName   e.g. "Paris", "Machu Picchu", "Angkor Wat"
 * @param {string} countryName e.g. "France" (used to improve search relevance)
 * @returns {Promise<string|null>} absolute image URL or null
 */
export async function fetchPlacePhoto(placeName, countryName = '') {
  // ─── 1. Wikimedia Commons: search for city/place landscape photos ───────────
  try {
    const q = countryName
      ? `${placeName} ${countryName} city landscape`
      : `${placeName} city landscape`

    const url =
      `${COMMONS}?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6` +
      `&prop=imageinfo&iiprop=url|dimensions` +
      `&iiurlwidth=900&format=json&origin=*&gsrlimit=12`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Commons search failed')
    const data = await res.json()
    const pages = Object.values(data.query?.pages || {})

    // Keep only real photos (jpg/png/webp), no SVGs/maps/icons
    const photos = pages
      .map((p) => p.imageinfo?.[0])
      .filter((info) => {
        if (!info?.url) return false
        const u = info.url.toLowerCase()
        return (
          !u.includes('.svg') &&
          !u.includes('.gif') &&
          !u.includes('icon') &&
          !u.includes('logo') &&
          !u.includes('flag') &&
          !u.includes('map') &&
          (u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.webp'))
        )
      })
      // Prefer landscape images (width ≥ height)
      .sort((a, b) => {
        const aIsLandscape = (a.width || 0) >= (a.height || 0)
        const bIsLandscape = (b.width || 0) >= (b.height || 0)
        return bIsLandscape - aIsLandscape
      })

    if (photos.length > 0) {
      return photos[0].thumburl || photos[0].url
    }
  } catch (_) {
    // fall through to next method
  }

  // ─── 2. Wikipedia article thumbnail (fastest, always relevant) ──────────────
  try {
    const url =
      `${WIKI}?action=query&titles=${encodeURIComponent(placeName)}` +
      `&prop=pageimages&piprop=original|thumbnail&pithumbsize=900` +
      `&format=json&origin=*`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Wiki pageimages failed')
    const data = await res.json()
    const page = Object.values(data.query?.pages || {})[0]

    if (page?.original?.source) return page.original.source
    if (page?.thumbnail?.source) return page.thumbnail.source
  } catch (_) {
    // fall through
  }

  return null
}

/**
 * Batch-fetch photos for multiple places in parallel, rate-limited in groups of 4.
 * @param {Array<{name:string, country?:string}>} places
 * @returns {Promise<Record<string, string|null>>}  map of name → photoUrl
 */
export async function fetchPlacePhotos(places) {
  const results = {}
  const BATCH = 4

  for (let i = 0; i < places.length; i += BATCH) {
    const batch = places.slice(i, i + BATCH)
    const settled = await Promise.allSettled(
      batch.map((p) => fetchPlacePhoto(p.name, p.country || ''))
    )
    settled.forEach((r, idx) => {
      results[batch[idx].name] = r.status === 'fulfilled' ? r.value : null
    })
    // small delay between batches to be polite to Wikipedia
    if (i + BATCH < places.length) await new Promise((r) => setTimeout(r, 300))
  }

  return results
}
