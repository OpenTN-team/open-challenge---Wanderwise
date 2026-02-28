import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debounced city search hook using Nominatim
 */
export function useCitySearch(query, delay = 400) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (timerRef.current) clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const { searchCities } = await import('../services/nominatim.js')
        const cities = await searchCities(query, 8)
        if (!controller.signal.aborted) {
          setResults(cities)
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, delay])

  return { results, loading, error }
}

/**
 * Weather data hook for given coordinates
 */
export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (lat == null || lng == null) return

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const { fetchWeather } = await import('../services/openMeteo.js')
        const data = await fetchWeather(lat, lng)
        if (!cancelled) {
          setWeather(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [lat, lng])

  return { weather, loading, error }
}

/**
 * Monthly climate data hook
 */
export function useClimate(lat, lng) {
  const [climate, setClimate] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lat == null || lng == null) return
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const { fetchHistoricalWeather } = await import('../services/openMeteo.js')
        const data = await fetchHistoricalWeather(lat, lng)
        if (!cancelled) {
          setClimate(data)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Climate fetch failed:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [lat, lng])

  return { climate, loading }
}

/**
 * Destination enrichment hook — Wikipedia + Country + Weather combined
 */
export function useDestinationDetails(cityName, countryCode, lat, lng) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cityName) return
    let cancelled = false
    setLoading(true)

    async function load() {
      const result = { wiki: null, country: null, weather: null, image: null }
      try {
        const [wikiMod, countryMod, weatherMod] = await Promise.all([
          import('../services/wikipedia.js'),
          import('../services/restCountries.js'),
          import('../services/openMeteo.js'),
        ])

        const [wikiData, countryData, weatherData] = await Promise.allSettled([
          wikiMod.fetchDestinationInfo(cityName),
          countryCode
            ? countryMod.fetchCountryByCode(countryCode)
            : countryMod.fetchCountryByName(cityName),
          lat != null && lng != null ? weatherMod.fetchWeather(lat, lng) : null,
        ])

        result.wiki = wikiData.status === 'fulfilled' ? wikiData.value : null
        result.country = countryData.status === 'fulfilled' ? countryData.value : null
        result.weather = weatherData.status === 'fulfilled' ? weatherData.value : null
        if (result.wiki?.image) result.image = result.wiki.image

        if (!cancelled) {
          setDetails(result)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Details fetch failed:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [cityName, countryCode, lat, lng])

  return { details, loading }
}

/**
 * Heritage sites hook from Overpass API
 */
export function useHeritageSites(lat, lng, radiusKm = 50) {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async (newLat, newLng, newRadius) => {
    const la = newLat ?? lat
    const ln = newLng ?? lng
    const r = newRadius ?? radiusKm
    if (la == null || ln == null) return

    setLoading(true)
    setError(null)
    try {
      const { fetchHeritageSites } = await import('../services/overpass.js')
      const data = await fetchHeritageSites(la, ln, r)
      setSites(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [lat, lng, radiusKm])

  useEffect(() => {
    if (lat != null && lng != null) load()
  }, [lat, lng, radiusKm, load])

  return { sites, loading, error, refetch: load }
}

/**
 * Tourism POIs hook
 */
export function useTourismPOIs(lat, lng, radiusKm = 20) {
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lat == null || lng == null) return
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const { fetchTourismPOIs } = await import('../services/overpass.js')
        const data = await fetchTourismPOIs(lat, lng, radiusKm, 50)
        if (!cancelled) {
          setPois(data)
          setLoading(false)
        }
      } catch (err) {
        console.warn('POI fetch failed:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [lat, lng, radiusKm])

  return { pois, loading }
}

/**
 * Carbon calculation hook
 */
export function useCarbonCalc() {
  const [result, setResult] = useState(null)

  const calculate = useCallback(async (params) => {
    try {
      const { calculateTripCarbon } = await import('../services/carbon.js')
      const data = calculateTripCarbon(params)
      setResult(data)
      return data
    } catch (err) {
      console.warn('Carbon calc failed:', err)
      return null
    }
  }, [])

  return { result, calculate }
}
