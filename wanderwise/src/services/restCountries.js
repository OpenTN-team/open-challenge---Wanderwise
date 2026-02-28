// RestCountries API — free, no key
const BASE = 'https://restcountries.com/v3.1'

export async function fetchCountryByCode(code) {
  if (!code) return null
  const url = `${BASE}/alpha/${code.toLowerCase()}?fields=name,capital,currencies,languages,population,area,flags,region,subregion,latlng,timezones`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return {
      name: data.name?.common || '',
      officialName: data.name?.official || '',
      capital: data.capital?.[0] || '',
      currencies: data.currencies ? Object.values(data.currencies).map((c) => `${c.name} (${c.symbol || ''})`) : [],
      languages: data.languages ? Object.values(data.languages) : [],
      population: data.population || 0,
      area: data.area || 0,
      flag: data.flags?.svg || data.flags?.png || '',
      flagEmoji: data.flag || '',
      region: data.region || '',
      subregion: data.subregion || '',
      latlng: data.latlng || [],
      timezones: data.timezones || [],
    }
  } catch {
    return null
  }
}

export async function fetchCountryByName(name) {
  if (!name) return null
  const url = `${BASE}/name/${encodeURIComponent(name)}?fields=name,capital,currencies,languages,population,area,flags,region,subregion,latlng,timezones,cca2`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const country = data[0]
    return {
      code: country.cca2 || '',
      name: country.name?.common || '',
      officialName: country.name?.official || '',
      capital: country.capital?.[0] || '',
      currencies: country.currencies ? Object.values(country.currencies).map((c) => `${c.name} (${c.symbol || ''})`) : [],
      languages: country.languages ? Object.values(country.languages) : [],
      population: country.population || 0,
      area: country.area || 0,
      flag: country.flags?.svg || country.flags?.png || '',
      region: country.region || '',
      subregion: country.subregion || '',
    }
  } catch {
    return null
  }
}
