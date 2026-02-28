// Wikipedia / MediaWiki API — free, no API key
const BASE = 'https://en.wikipedia.org/w/api.php'

export async function fetchWikiSummary(title) {
  const url = `${BASE}?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages|info&exintro=1&explaintext=1&piprop=original|thumbnail&pithumbsize=800&inprop=url&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) return null
  const page = Object.values(pages)[0]
  if (page.missing !== undefined) return null
  return {
    title: page.title,
    extract: page.extract || '',
    thumbnail: page.thumbnail?.source || null,
    originalImage: page.original?.source || null,
    url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

export async function searchWiki(query, limit = 5) {
  const url = `${BASE}?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return []
  const [, titles] = await res.json()
  return titles
}

export async function fetchWikiImage(title) {
  const url = `${BASE}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=600&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const page = Object.values(data.query?.pages || {})[0]
  return page?.thumbnail?.source || page?.original?.source || null
}

// Fetch multiple related articles for a destination
export async function fetchDestinationInfo(cityName, countryName) {
  const queries = [
    `${cityName}`,
    `${cityName} tourism`,
    `Tourism in ${countryName}`,
  ]
  
  // Try each query until we get a good result
  for (const q of queries) {
    const result = await fetchWikiSummary(q)
    if (result && result.extract && result.extract.length > 100) {
      return result
    }
  }
  
  // Fallback: search and take first result
  const titles = await searchWiki(`${cityName} ${countryName}`)
  if (titles.length > 0) {
    return await fetchWikiSummary(titles[0])
  }
  return null
}
