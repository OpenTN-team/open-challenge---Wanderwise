import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { travelPreferences } from '../data/mockData'
import { useCitySearch } from '../hooks/useApi'
import { fetchPlacePhoto } from '../services/photos'
import { Sparkles, Leaf, Users, DollarSign, Star, MapPin, Clock, ChevronDown, Filter, ArrowUpDown, Search, Loader2, Thermometer, Globe2, Cloud, X } from 'lucide-react'

// 20 diverse real-world cities to auto-load on mount
const POPULAR_CITIES = [
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, countryCode: 'FR', region: 'Western Europe', category: ['cultural', 'art', 'food', 'heritage'] },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, countryCode: 'JP', region: 'East Asia', category: ['cultural', 'food'] },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811, countryCode: 'MA', region: 'North Africa', category: ['cultural', 'heritage', 'food'] },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, countryCode: 'ZA', region: 'Southern Africa', category: ['nature', 'adventure', 'beach'] },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681, countryCode: 'JP', region: 'East Asia', category: ['cultural', 'heritage', 'spiritual'] },
  { name: 'Chefchaouen', country: 'Morocco', lat: 35.1688, lng: -5.2636, countryCode: 'MA', region: 'North Africa', category: ['cultural', 'heritage', 'nature'], hiddenGem: true },
  { name: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058, countryCode: 'SI', region: 'Central Europe', category: ['sustainable', 'cultural', 'food'], hiddenGem: true },
  { name: 'Luang Prabang', country: 'Laos', lat: 19.8856, lng: 102.1347, countryCode: 'LA', region: 'Southeast Asia', category: ['spiritual', 'heritage', 'nature'], hiddenGem: true },
  { name: 'Essaouira', country: 'Morocco', lat: 31.5085, lng: -9.7595, countryCode: 'MA', region: 'North Africa', category: ['cultural', 'beach', 'music'], hiddenGem: true },
  { name: 'Tallinn', country: 'Estonia', lat: 59.437, lng: 24.7536, countryCode: 'EE', region: 'Northern Europe', category: ['cultural', 'heritage'], hiddenGem: true },
  { name: 'Valparaíso', country: 'Chile', lat: -33.0472, lng: -71.6127, countryCode: 'CL', region: 'South America', category: ['cultural', 'art', 'heritage'] },
  { name: 'Fes', country: 'Morocco', lat: 34.0331, lng: -5.0003, countryCode: 'MA', region: 'North Africa', category: ['cultural', 'heritage', 'artisan'] },
  { name: 'Hallstatt', country: 'Austria', lat: 47.5622, lng: 13.6493, countryCode: 'AT', region: 'Central Europe', category: ['nature', 'heritage', 'adventure'] },
  { name: 'Tbilisi', country: 'Georgia', lat: 41.6938, lng: 44.8015, countryCode: 'GE', region: 'Caucasus', category: ['cultural', 'heritage', 'food'], hiddenGem: true },
  { name: 'Hoi An', country: 'Vietnam', lat: 15.8801, lng: 108.338, countryCode: 'VN', region: 'Southeast Asia', category: ['cultural', 'heritage', 'food'], hiddenGem: true },
  { name: 'Dubrovnik', country: 'Croatia', lat: 42.6507, lng: 18.0944, countryCode: 'HR', region: 'Southern Europe', category: ['cultural', 'heritage', 'beach'] },
  { name: 'Oaxaca', country: 'Mexico', lat: 17.0732, lng: -96.7266, countryCode: 'MX', region: 'Central America', category: ['cultural', 'food', 'art'], hiddenGem: true },
  { name: 'Bhutan', country: 'Bhutan', lat: 27.4728, lng: 89.6393, countryCode: 'BT', region: 'South Asia', category: ['spiritual', 'nature', 'sustainable'], hiddenGem: true },
  { name: 'Zanzibar', country: 'Tanzania', lat: -6.165, lng: 39.199, countryCode: 'TZ', region: 'East Africa', category: ['beach', 'cultural', 'heritage'], hiddenGem: true },
  { name: 'Cusco', country: 'Peru', lat: -13.5319, lng: -71.9675, countryCode: 'PE', region: 'South America', category: ['heritage', 'adventure', 'cultural'], hiddenGem: false },
]

// Enrich a city result with Wikipedia + Weather + Country data
async function enrichCity(city) {
  const result = { ...city, wiki: null, weather: null, country: null, image: null }
  try {
    const [wikiMod, weatherMod, countryMod] = await Promise.all([
      import('../services/wikipedia.js'),
      import('../services/openMeteo.js'),
      import('../services/restCountries.js'),
    ])
    const [wikiData, weatherData, countryData] = await Promise.allSettled([
      wikiMod.fetchDestinationInfo(city.name, city.country),
      weatherMod.fetchWeather(city.lat, city.lng),
      city.countryCode
        ? countryMod.fetchCountryByCode(city.countryCode)
        : countryMod.fetchCountryByName(city.country || city.name),
    ])
    result.wiki = wikiData.status === 'fulfilled' ? wikiData.value : null
    result.weather = weatherData.status === 'fulfilled' ? weatherData.value : null
    result.country = countryData.status === 'fulfilled' ? countryData.value : null
    // wikipedia.js returns { thumbnail, originalImage, extract } — not image/summary
    if (result.wiki?.thumbnail) result.image = result.wiki.thumbnail
    else if (result.wiki?.originalImage) result.image = result.wiki.originalImage
    // If no wiki image, try Wikimedia Commons photo service
    if (!result.image) {
      try {
        const photo = await fetchPlacePhoto(city.name, city.country || '')
        if (photo) result.image = photo
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Enrichment failed for', city.name, err)
  }
  return result
}

// Calculate a dynamic sustainability score based on real data
function calcSustainabilityScore(city, enrichedData) {
  let score = 60
  // Population factor (smaller = more sustainable for tourism)
  if (enrichedData.country?.population) {
    const pop = enrichedData.country.population
    if (pop < 1_000_000) score += 12
    else if (pop < 10_000_000) score += 8
    else if (pop < 50_000_000) score += 4
  }
  // Weather factor — moderate climate is more walkable
  if (enrichedData.weather?.current) {
    const temp = enrichedData.weather.current.temperature
    if (temp >= 15 && temp <= 28) score += 8
    else if (temp >= 5 && temp <= 35) score += 4
  }
  // Region factor
  if (enrichedData.country?.region === 'Europe') score += 5
  if (enrichedData.country?.region === 'Africa') score += 6
  // Cap
  return Math.min(Math.round(score + Math.random() * 8), 98)
}

export default function Recommender() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrefs, setSelectedPrefs] = useState([])
  const [budget, setBudget] = useState(200)
  const [sustainabilityMin, setSustainabilityMin] = useState(0)
  const [sortBy, setSortBy] = useState('match')
  const [showFilters, setShowFilters] = useState(true)
  const [liveResults, setLiveResults] = useState([])
  const [enriching, setEnriching] = useState(false)
  const [enrichedCities, setEnrichedCities] = useState([])
  const [searchMode, setSearchMode] = useState(false) // false= mock, true= live API
  const searchInputRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(12)
  const loadRef = useRef(null)
  const [selectedDest, setSelectedDest] = useState(null)
  const [autoLoadedCities, setAutoLoadedCities] = useState([])
  const [autoLoadingInitial, setAutoLoadingInitial] = useState(true)
  const autoLoaded = useRef(false)

  const { results: cityResults, loading: searching } = useCitySearch(searchQuery)

  const togglePref = (id) => {
    setSelectedPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // When cities are returned from search, enrich them with details
  const handleSelectCity = useCallback(async (city) => {
    setSearchQuery(city.displayName || city.name)
    setSearchMode(true)
    setEnriching(true)
    setLiveResults([])

    try {
      const enriched = await enrichCity(city)
      setEnrichedCities((prev) => {
        // Don't duplicate
        const without = prev.filter((c) => !(c.name === enriched.name && c.lat === enriched.lat))
        return [enriched, ...without].slice(0, 20)
      })
    } catch (err) {
      console.warn('Enrich failed:', err)
    }
    setEnriching(false)
  }, [])

  // Search and enrich all results at once
  const handleSearchSubmit = useCallback(async () => {
    if (!cityResults.length) return
    setSearchMode(true)
    setEnriching(true)

    try {
      const enriched = await Promise.all(cityResults.slice(0, 6).map(enrichCity))
      setEnrichedCities(enriched)
    } catch (err) {
      console.warn('Batch enrich failed:', err)
    }
    setEnriching(false)
  }, [cityResults])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    setEnrichedCities([])
    setEnriching(false)
  }

  // Auto-load popular world destinations on mount
  useEffect(() => {
    if (autoLoaded.current) return
    autoLoaded.current = true
    async function loadCities() {
      setAutoLoadingInitial(true)
      for (let i = 0; i < POPULAR_CITIES.length; i += 4) {
        const batch = POPULAR_CITIES.slice(i, i + 4)
        const settled = await Promise.allSettled(batch.map(enrichCity))
        const valid = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        setAutoLoadedCities((prev) => [...prev, ...valid])
        if (i === 0) setAutoLoadingInitial(false)
        if (i + 4 < POPULAR_CITIES.length) await new Promise((r) => setTimeout(r, 600))
      }
    }
    loadCities()
  }, [])

  // Convert an enriched city to the unified destination format
  const toDestFormat = useCallback((city) => {
    const countryName = typeof city.country === 'string'
      ? city.country
      : (city.country?.name || city.displayName?.split(', ').pop() || city.country || '')
    const rawExtract = city.wiki?.extract || ''
    const description = rawExtract
      ? rawExtract.split('.').slice(0, 3).filter(Boolean).join('.') + '.'
      : `Discover ${city.name}, a fascinating destination in ${countryName || 'the world'}.`
    const avgCost =
      city.country?.region === 'Africa' ? 50
      : city.country?.region === 'Asia' ? 65
      : city.country?.region === 'Oceania' ? 130
      : city.country?.region === 'Americas' ? 80
      : 100
    return {
      id: `live-${city.name}-${city.lat}`,
      name: city.name,
      country: countryName,
      region: city.region || city.country?.subregion || '',
      lat: city.lat,
      lng: city.lng,
      image: city.image || `https://placehold.co/600x400/10b981/white?text=${encodeURIComponent(city.name + ' travel')}`,
      description,
      sustainabilityScore: calcSustainabilityScore(city, city),
      crowdLevel: city.weather?.current?.temperature > 28 ? 'high'
        : city.weather?.current?.temperature > 20 ? 'medium' : 'low',
      bestTime: city.weather?.current
        ? `Now: ${Math.round(city.weather.current.temperature)}°C`
        : 'Check weather',
      avgCost,
      culturalHighlights: rawExtract ? [rawExtract.split('.')[0]] : [],
      ecoTips: rawExtract
        ? [
            `Explore ${city.name} by walking or cycling to reduce your carbon footprint.`,
            `Support local artisans and family-owned businesses in ${countryName || city.name}.`,
            `Carry a reusable water bottle and bag when visiting ${city.name}.`,
          ]
        : ['Support local businesses', 'Use public transport', 'Respect cultural heritage'],
      carbonFootprint: 1.0,
      category: city.category || ['cultural'],
      hiddenGem: city.hiddenGem || false,
      weather: city.weather,
      countryData: city.country,
      isLive: true,
    }
  }, [])

  // Build combined data source — always live, never mock
  const allDestinations = useMemo(() => {
    const source = searchMode && enrichedCities.length > 0 ? enrichedCities : autoLoadedCities
    return source.map(toDestFormat)
  }, [searchMode, enrichedCities, autoLoadedCities, toDestFormat])

  // AI-simulated recommendation scoring
  const recommendations = useMemo(() => {
    return allDestinations
      .map((dest) => {
        let score = 50
        const matchCount = (dest.category || []).filter((c) => selectedPrefs.includes(c)).length
        if (selectedPrefs.length > 0) {
          score += matchCount * 20
        } else {
          score += 30
        }
        if (dest.avgCost <= budget) score += 15
        else score -= (dest.avgCost - budget) / 5
        score += (dest.sustainabilityScore || 60) / 5
        if (dest.hiddenGem) score += 10
        if (dest.crowdLevel === 'low') score += 8
        if (dest.crowdLevel === 'medium') score += 4
        return { ...dest, matchScore: Math.min(Math.round(score), 99) }
      })
      .filter((d) => (d.sustainabilityScore || 0) >= sustainabilityMin)
      .filter((d) => (d.avgCost || 0) <= budget)
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore
        if (sortBy === 'sustainability') return (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0)
        if (sortBy === 'cost') return (a.avgCost || 0) - (b.avgCost || 0)
        return 0
      })
  }, [allDestinations, selectedPrefs, budget, sustainabilityMin, sortBy])

  // reset and scroll handler effects
  useEffect(() => {
    setVisibleCount(12)
  }, [recommendations])

  useEffect(() => {
    if (!loadRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((v) => Math.min(v + 12, recommendations.length))
      }
    }, { rootMargin: '200px' })
    obs.observe(loadRef.current)
    return () => obs.disconnect()
  }, [recommendations])

  const getCrowdColor = (level) => {
    if (level === 'low') return 'text-emerald-600 bg-emerald-100'
    if (level === 'medium') return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
          <Sparkles size={16} />
          AI-Powered Real-Time Recommendations
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Find Your Perfect <span className="gradient-text">Destination</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Search any city worldwide — we fetch live Wikipedia, weather, and country data
          to build real-time sustainability profiles.
        </p>
      </div>

      {/* Live Search Bar */}
      <div className="relative mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search any city worldwide (e.g. Tokyo, Barcelona, Marrakech...)"
              className="flex-1 text-lg outline-none placeholder:text-slate-400"
            />
            {searching && <Loader2 size={20} className="text-emerald-500 animate-spin" />}
            {searchMode && (
              <button onClick={clearSearch} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            )}
            <button
              onClick={handleSearchSubmit}
              disabled={!cityResults.length}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 transition-all hover:shadow-md"
            >
              Search
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {cityResults.length > 0 && !searchMode && searchQuery.length >= 2 && (
            <div className="mt-3 border-t border-slate-100 pt-3 max-h-60 overflow-y-auto">
              {cityResults.map((city, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MapPin size={16} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-800">{city.name}</span>
                    <span className="text-slate-400 ml-2 text-sm">{city.country}</span>
                    {city.region && <span className="text-slate-300 ml-1 text-xs">• {city.region}</span>}
                  </div>
                </button>
              ))}
              <div className="text-center pt-2">
                <button
                  onClick={handleSearchSubmit}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Search all {cityResults.length} results →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enriching indicator */}
        {enriching && (
          <div className="mt-3 flex items-center gap-2 justify-center text-emerald-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Fetching live data from Wikipedia, Open-Meteo & RestCountries...</span>
          </div>
        )}

        {/* API source indicator */}
        {searchMode && enrichedCities.length > 0 && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              <Globe2 size={12} />
              Live results from Nominatim + Wikipedia + Open-Meteo + RestCountries
            </span>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Filter size={20} />
            Travel Preferences & Filters
          </div>
          <ChevronDown size={20} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-6">
            {/* Interest Tags */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">What excites you? (select multiple)</label>
              <div className="flex flex-wrap gap-2">
                {travelPreferences.map((pref) => (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedPrefs.includes(pref.id)
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pref.icon} {pref.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign size={16} className="inline mr-1" />
                  Max Daily Budget: <span className="text-emerald-600">${budget}</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>$20</span>
                  <span>$300</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Leaf size={16} className="inline mr-1" />
                  Min Sustainability Score: <span className="text-emerald-600">{sustainabilityMin}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="95"
                  value={sustainabilityMin}
                  onChange={(e) => setSustainabilityMin(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Any</span>
                  <span>95+</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort & Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-600">
          <span className="font-bold text-emerald-600">{recommendations.length}</span> destinations match
          {searchMode && <span className="text-xs text-slate-400 ml-2">(Live API results)</span>}
        </p>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="match">Best AI Match</option>
            <option value="sustainability">Most Sustainable</option>
            <option value="cost">Lowest Cost</option>
          </select>
        </div>
      </div>

      {/* Initial loading skeletons */}
      {autoLoadingInitial && autoLoadedCities.length === 0 && !searchMode && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-12 bg-slate-100 rounded" />
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live loading more indicator */}
      {!autoLoadingInitial && autoLoadedCities.length > 0 && autoLoadedCities.length < POPULAR_CITIES.length && !searchMode && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 justify-end">
          <Loader2 size={12} className="animate-spin" />
          Loading more destinations... ({autoLoadedCities.length}/{POPULAR_CITIES.length})
        </div>
      )}

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.slice(0, visibleCount).map((dest, i) => (
          <div
            key={dest.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up cursor-pointer"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => setSelectedDest(dest)}
          >
            {/* Image */}
            <div className="relative h-48 bg-slate-200">
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.target.src = `https://placehold.co/600x400/10b981/white?text=${encodeURIComponent(dest.name)}` }}
              />
              {/* Match badge */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Sparkles size={14} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700">{dest.matchScore}%</span>
              </div>
              {dest.isLive && (
                <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <Globe2 size={10} /> Live Data
                </div>
              )}
              {dest.hiddenGem && !dest.isLive && (
                <div className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-amber-900">
                  ✨ Hidden Gem
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{dest.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={14} />
                    {dest.country}
                    {dest.countryData?.flagEmoji && <span className="ml-1">{dest.countryData.flagEmoji}</span>}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{dest.description}</p>

              {/* Live weather data */}
              {dest.weather?.current && (
                <div className="flex items-center gap-3 mb-4 p-2.5 bg-sky-50 rounded-lg text-sm">
                  <Thermometer size={16} className="text-sky-500" />
                  <span className="font-medium text-sky-700">
                    {Math.round(dest.weather.current.temperature)}°C
                  </span>
                  <Cloud size={14} className="text-sky-400" />
                  <span className="text-sky-600 text-xs">
                    {dest.weather.current.description || 'Current'}
                  </span>
                  <span className="text-xs text-sky-400 ml-auto">Live</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(dest.category || []).map((cat) => (
                  <span
                    key={cat}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedPrefs.includes(cat)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat}
                  </span>
                ))}
                {dest.countryData?.region && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-600">
                    {dest.countryData.region}
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Leaf size={14} className="text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">{dest.sustainabilityScore}</span>
                  </div>
                  <span className="text-xs text-slate-400">Eco Score</span>
                </div>
                <div className="text-center">
                  <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCrowdColor(dest.crowdLevel)} mb-1`}>
                    {dest.crowdLevel}
                  </div>
                  <span className="text-xs text-slate-400 block">Crowds</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 mb-1">
                    <DollarSign size={14} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{dest.avgCost}</span>
                  </div>
                  <span className="text-xs text-slate-400">/day</span>
                </div>
              </div>

              {/* Best time */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                <Clock size={12} />
                {dest.isLive ? 'Weather' : 'Best time'}: <span className="font-medium text-slate-700">{dest.bestTime}</span>
              </div>

              {/* Eco tips */}
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs font-semibold text-emerald-700 mb-1">🌿 Eco Tip:</p>
                <p className="text-xs text-emerald-600">{dest.ecoTips[0]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < recommendations.length && (
        <div ref={loadRef} className="h-16 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {recommendations.length === 0 && !enriching && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No destinations match your criteria</h3>
          <p className="text-slate-500">Try adjusting your budget or sustainability filters, or search for a city above</p>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedDest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedDest(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero image */}
            <div className="relative h-64 flex-shrink-0">
              <img
                src={selectedDest.image}
                alt={selectedDest.name}
                className="w-full h-full object-cover rounded-t-3xl"
                onError={(e) => { e.target.src = `https://placehold.co/800x400/10b981/white?text=${encodeURIComponent(selectedDest.name)}` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent rounded-t-3xl" />
              {/* Close */}
              <button
                onClick={() => setSelectedDest(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition"
              >
                <X size={20} />
              </button>
              {/* Title overlay */}
              <div className="absolute bottom-5 left-6">
                <h2 className="text-3xl font-bold text-white mb-1">{selectedDest.name}</h2>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <MapPin size={14} />
                  {selectedDest.country}
                  {selectedDest.countryData?.flagEmoji && (
                    <span className="text-xl ml-1">{selectedDest.countryData.flagEmoji}</span>
                  )}
                </div>
              </div>
              {/* Top-left badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700">{selectedDest.matchScore}%</span>
                </div>
                {selectedDest.isLive && (
                  <div className="bg-emerald-500/90 rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                    <Globe2 size={10} /> Live
                  </div>
                )}
                {selectedDest.hiddenGem && (
                  <div className="bg-amber-400/90 rounded-full px-3 py-1 text-xs font-bold text-amber-900">
                    ✨ Hidden Gem
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-emerald-50 rounded-2xl">
                  <Leaf size={20} className="text-emerald-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-emerald-600">{selectedDest.sustainabilityScore}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-0.5">Eco Score</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <DollarSign size={20} className="text-slate-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">${selectedDest.avgCost}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Per Day</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-2xl">
                  <Users size={20} className="text-amber-500 mx-auto mb-1" />
                  <div className={`text-lg font-bold capitalize mt-0.5 ${
                    selectedDest.crowdLevel === 'low' ? 'text-emerald-600'
                    : selectedDest.crowdLevel === 'medium' ? 'text-amber-600'
                    : 'text-red-600'
                  }`}>{selectedDest.crowdLevel}</div>
                  <div className="text-xs text-amber-700 font-medium">Crowds</div>
                </div>
              </div>

              {/* About */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">About</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{selectedDest.description}</p>
              </div>

              {/* Live weather */}
              {selectedDest.weather?.current && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Thermometer size={18} className="text-sky-500" /> Current Weather
                  </h3>
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl font-bold text-sky-700">
                        {Math.round(selectedDest.weather.current.temperature)}°C
                      </div>
                      <div>
                        <div className="text-sky-600 font-medium">
                          {selectedDest.weather.current.description || 'Current conditions'}
                        </div>
                        {selectedDest.weather.current.humidity != null && (
                          <div className="text-xs text-sky-400 mt-0.5">
                            Humidity: {selectedDest.weather.current.humidity}%
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 7-day forecast */}
                    {selectedDest.weather.daily?.length > 0 && (
                      <div className="grid grid-cols-7 gap-1 border-t border-sky-100 pt-3">
                        {selectedDest.weather.daily.slice(0, 7).map((day, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-xs text-sky-400 mb-1">
                              {idx === 0
                                ? 'Today'
                                : new Date(Date.now() + idx * 86400000).toLocaleDateString('en', { weekday: 'short' })}
                            </div>
                            <div className="text-sm font-bold text-sky-700">
                              {Math.round(day.maxTemp ?? day.temp ?? day.temperature_2m_max ?? 0)}°
                            </div>
                            <div className="text-xs text-sky-400">
                              {Math.round(day.minTemp ?? (day.temp - 5) ?? day.temperature_2m_min ?? 0)}°
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Country info */}
              {selectedDest.countryData && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Globe2 size={18} className="text-violet-500" /> Country Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDest.countryData.capital && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Capital</div>
                        <div className="font-semibold text-slate-700">
                          {Array.isArray(selectedDest.countryData.capital)
                            ? selectedDest.countryData.capital[0]
                            : selectedDest.countryData.capital}
                        </div>
                      </div>
                    )}
                    {selectedDest.countryData.population && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Population</div>
                        <div className="font-semibold text-slate-700">
                          {(selectedDest.countryData.population / 1_000_000).toFixed(1)}M
                        </div>
                      </div>
                    )}
                    {selectedDest.countryData.region && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Region</div>
                        <div className="font-semibold text-slate-700">{selectedDest.countryData.region}</div>
                      </div>
                    )}
                    {selectedDest.countryData.currencies && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-400 mb-1">Currency</div>
                        <div className="font-semibold text-slate-700 text-sm">
                          {Array.isArray(selectedDest.countryData.currencies)
                            ? selectedDest.countryData.currencies.join(', ')
                            : typeof selectedDest.countryData.currencies === 'object'
                              ? Object.values(selectedDest.countryData.currencies)
                                  .map((c) => typeof c === 'string' ? c : `${c.name}${c.symbol ? ` (${c.symbol})` : ''}`)
                                  .join(', ')
                              : String(selectedDest.countryData.currencies)}
                        </div>
                      </div>
                    )}
                    {selectedDest.countryData.languages && (
                      <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-slate-400 mb-1">Languages</div>
                        <div className="font-semibold text-slate-700">
                          {Array.isArray(selectedDest.countryData.languages)
                            ? selectedDest.countryData.languages.join(', ')
                            : typeof selectedDest.countryData.languages === 'object'
                              ? Object.values(selectedDest.countryData.languages).join(', ')
                              : String(selectedDest.countryData.languages)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Eco tips */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Leaf size={18} className="text-emerald-500" /> Eco Travel Tips
                </h3>
                <div className="space-y-2">
                  {(selectedDest.ecoTips || []).map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                      <span className="text-emerald-500 text-sm mt-0.5">🌿</span>
                      <span className="text-sm text-emerald-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural highlights */}
              {(selectedDest.culturalHighlights || []).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Star size={18} className="text-amber-500" /> Cultural Highlights
                  </h3>
                  <div className="space-y-2">
                    {selectedDest.culturalHighlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                        <span className="text-amber-500 text-sm mt-0.5">⭐</span>
                        <span className="text-sm text-amber-700">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best time + carbon */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-teal-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-teal-500" />
                    <span className="text-sm font-semibold text-teal-700">Best Time</span>
                  </div>
                  <div className="text-teal-600 font-bold text-sm">{selectedDest.bestTime}</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud size={16} className="text-orange-400" />
                    <span className="text-sm font-semibold text-orange-700">Carbon</span>
                  </div>
                  <div className="text-orange-600 font-bold">{selectedDest.carbonFootprint}× avg</div>
                </div>
              </div>

              {/* Wikipedia link */}
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedDest.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition text-sm"
              >
                <Globe2 size={16} />
                Read more on Wikipedia
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
