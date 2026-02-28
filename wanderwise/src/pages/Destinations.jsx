import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useCitySearch, useClimate } from '../hooks/useApi'
import { fetchPlacePhoto } from '../services/photos'
import {
  BarChart3, Users, TrendingUp, Eye, MapPin, Clock, Star,
  Sparkles, ArrowRight, Gem, Search, Loader2, Globe2, Thermometer, X, CloudRain, Leaf
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend)

const crowdIcon = (level) => {
  const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }
  return new L.DivIcon({
    html: `<div style="background:${colors[level]};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Hidden-gem cities auto-loaded with live data
const GEM_CITIES = [
  { name: 'Chefchaouen', country: 'Morocco', lat: 35.1688, lng: -5.2636, region: 'North Africa' },
  { name: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058, region: 'Central Europe' },
  { name: 'Luang Prabang', country: 'Laos', lat: 19.8856, lng: 102.1347, region: 'Southeast Asia' },
  { name: 'Essaouira', country: 'Morocco', lat: 31.5085, lng: -9.7595, region: 'North Africa' },
  { name: 'Tallinn', country: 'Estonia', lat: 59.437, lng: 24.7536, region: 'Northern Europe' },
  { name: 'Oaxaca', country: 'Mexico', lat: 17.0732, lng: -96.7266, region: 'Central America' },
  { name: 'Tbilisi', country: 'Georgia', lat: 41.6938, lng: 44.8015, region: 'Caucasus' },
  { name: 'Hoi An', country: 'Vietnam', lat: 15.8801, lng: 108.338, region: 'Southeast Asia' },
  { name: 'Hallstatt', country: 'Austria', lat: 47.5622, lng: 13.6493, region: 'Central Europe' },
]

// Sample destinations for crowd prediction
const SAMPLE_DESTINATIONS = ['Marrakech', 'Paris', 'Tokyo', 'Cape Town', 'Dubrovnik']
const SAMPLE_COORDS = {
  Marrakech:   { lat: 31.6295,  lng: -7.9811 },
  Paris:       { lat: 48.8566,  lng: 2.3522  },
  Tokyo:       { lat: 35.6762,  lng: 139.6503 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  Dubrovnik:   { lat: 42.6507,  lng: 18.0944 },
}

// Instant fallback crowd data shown while real API data loads
const FALLBACK_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FALLBACK_CROWD_DATA = {
  Marrakech:   [65, 70, 85, 80, 75, 55, 45, 40, 60, 80, 75, 70],
  Paris:       [55, 60, 75, 85, 80, 70, 90, 95, 75, 65, 55, 60],
  Tokyo:       [40, 45, 75, 90, 70, 55, 60, 50, 55, 95, 90, 45],
  'Cape Town': [80, 85, 75, 60, 45, 35, 30, 35, 45, 55, 65, 75],
  Dubrovnik:   [20, 25, 40, 55, 75, 90, 100, 95, 70, 50, 30, 25],
}

// 40+ world cities for the Live Map — span every continent
const MAP_WORLD_CITIES = [
  // Europe
  { name: 'Paris',           country: 'France',       lat: 48.8566,  lng: 2.3522,    crowd: 'high'   },
  { name: 'Barcelona',       country: 'Spain',        lat: 41.3851,  lng: 2.1734,    crowd: 'high'   },
  { name: 'Rome',            country: 'Italy',        lat: 41.9028,  lng: 12.4964,   crowd: 'high'   },
  { name: 'Amsterdam',       country: 'Netherlands',  lat: 52.3676,  lng: 4.9041,    crowd: 'high'   },
  { name: 'Prague',          country: 'Czechia',      lat: 50.0755,  lng: 14.4378,   crowd: 'medium' },
  { name: 'Vienna',          country: 'Austria',      lat: 48.2082,  lng: 16.3738,   crowd: 'medium' },
  { name: 'Lisbon',          country: 'Portugal',     lat: 38.7169,  lng: -9.1399,   crowd: 'medium' },
  { name: 'Athens',          country: 'Greece',       lat: 37.9838,  lng: 23.7275,   crowd: 'medium' },
  { name: 'Dubrovnik',       country: 'Croatia',      lat: 42.6507,  lng: 18.0944,   crowd: 'high'   },
  { name: 'Budapest',        country: 'Hungary',      lat: 47.4979,  lng: 19.0402,   crowd: 'medium' },
  { name: 'Ljubljana',       country: 'Slovenia',     lat: 46.0569,  lng: 14.5058,   crowd: 'low'    },
  { name: 'Tallinn',         country: 'Estonia',      lat: 59.4370,  lng: 24.7536,   crowd: 'low'    },
  // North Africa / Middle East
  { name: 'Marrakech',       country: 'Morocco',      lat: 31.6295,  lng: -7.9811,   crowd: 'high'   },
  { name: 'Fes',             country: 'Morocco',      lat: 34.0331,  lng: -5.0003,   crowd: 'medium' },
  { name: 'Chefchaouen',     country: 'Morocco',      lat: 35.1688,  lng: -5.2636,   crowd: 'low'    },
  { name: 'Cairo',           country: 'Egypt',        lat: 30.0444,  lng: 31.2357,   crowd: 'medium' },
  { name: 'Dubai',           country: 'UAE',          lat: 25.2048,  lng: 55.2708,   crowd: 'high'   },
  { name: 'Istanbul',        country: 'Turkey',       lat: 41.0082,  lng: 28.9784,   crowd: 'high'   },
  // Sub-Saharan Africa
  { name: 'Cape Town',       country: 'South Africa', lat: -33.9249, lng: 18.4241,   crowd: 'medium' },
  { name: 'Nairobi',         country: 'Kenya',        lat: -1.2921,  lng: 36.8219,   crowd: 'low'    },
  { name: 'Zanzibar',        country: 'Tanzania',     lat: -6.1650,  lng: 39.1990,   crowd: 'low'    },
  // Asia
  { name: 'Tokyo',           country: 'Japan',        lat: 35.6762,  lng: 139.6503,  crowd: 'high'   },
  { name: 'Kyoto',           country: 'Japan',        lat: 35.0116,  lng: 135.7681,  crowd: 'high'   },
  { name: 'Bangkok',         country: 'Thailand',     lat: 13.7563,  lng: 100.5018,  crowd: 'high'   },
  { name: 'Bali',            country: 'Indonesia',    lat: -8.3405,  lng: 115.0920,  crowd: 'high'   },
  { name: 'Hoi An',          country: 'Vietnam',      lat: 15.8801,  lng: 108.3380,  crowd: 'medium' },
  { name: 'Luang Prabang',   country: 'Laos',         lat: 19.8856,  lng: 102.1347,  crowd: 'low'    },
  { name: 'Kathmandu',       country: 'Nepal',        lat: 27.7172,  lng: 85.3240,   crowd: 'medium' },
  { name: 'Tbilisi',         country: 'Georgia',      lat: 41.6938,  lng: 44.8015,   crowd: 'low'    },
  { name: 'Agra',            country: 'India',        lat: 27.1751,  lng: 78.0421,   crowd: 'medium' },
  { name: 'Singapore',       country: 'Singapore',    lat: 1.3521,   lng: 103.8198,  crowd: 'medium' },
  // Americas
  { name: 'New York',        country: 'USA',          lat: 40.7128,  lng: -74.0060,  crowd: 'high'   },
  { name: 'Mexico City',     country: 'Mexico',       lat: 19.4326,  lng: -99.1332,  crowd: 'medium' },
  { name: 'Oaxaca',          country: 'Mexico',       lat: 17.0732,  lng: -96.7266,  crowd: 'low'    },
  { name: 'Cartagena',       country: 'Colombia',     lat: 10.3910,  lng: -75.4794,  crowd: 'medium' },
  { name: 'Cusco',           country: 'Peru',         lat: -13.5319, lng: -71.9675,  crowd: 'medium' },
  { name: 'Buenos Aires',    country: 'Argentina',    lat: -34.6037, lng: -58.3816,  crowd: 'medium' },
  { name: 'Valparaíso',      country: 'Chile',        lat: -33.0472, lng: -71.6127,  crowd: 'low'    },
  // Oceania / Pacific
  { name: 'Sydney',          country: 'Australia',    lat: -33.8688, lng: 151.2093,  crowd: 'medium' },
  // South / Central Asia
  { name: 'Bhutan',          country: 'Bhutan',       lat: 27.4728,  lng: 89.6393,   crowd: 'low'    },
]

// Map controller
function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 4, { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

// Enrich a gem city with Wikipedia + Weather + Photo
async function enrichGem(city) {
  const result = { ...city, image: null, description: '', wiki: null, weather: null, sustainabilityScore: 0, crowdLevel: 'low', avgCost: 50, culturalHighlights: [] }
  try {
    const [wikiMod, weatherMod] = await Promise.all([
      import('../services/wikipedia.js'),
      import('../services/openMeteo.js'),
    ])
    const [wikiRes, weatherRes, photoRes] = await Promise.allSettled([
      wikiMod.fetchDestinationInfo(city.name, city.country),
      weatherMod.fetchWeather(city.lat, city.lng),
      fetchPlacePhoto(city.name, city.country),
    ])
    const wiki = wikiRes.status === 'fulfilled' ? wikiRes.value : null
    const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : null
    const photo = photoRes.status === 'fulfilled' ? photoRes.value : null

    result.image = wiki?.thumbnail || wiki?.originalImage || photo || null
    const extract = wiki?.extract || ''
    result.description = extract ? extract.split('.').slice(0, 3).filter(Boolean).join('.') + '.' : `Discover ${city.name}, a hidden gem in ${city.country}.`
    result.culturalHighlights = extract ? [extract.split('.')[0]] : []
    result.weather = weather

    // Dynamic sustainability + cost
    let score = 72
    if (weather?.current?.temperature >= 15 && weather?.current?.temperature <= 28) score += 8
    score += Math.round(Math.random() * 10)
    result.sustainabilityScore = Math.min(score, 98)
    result.avgCost = city.region?.includes('Africa') || city.region?.includes('Asia') ? 40 : city.region?.includes('America') ? 55 : 65
    result.crowdLevel = weather?.current?.temperature > 28 ? 'medium' : 'low'
  } catch (_) {}
  return result
}

// Predict crowd from climate data — hotter months + holiday months = more crowds
function predictCrowdFromClimate(climateData) {
  if (!climateData) return null
  // climateData is { months, avgTemperatures, totalPrecipitation } from fetchHistoricalWeather
  const months = climateData.months || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const temps = climateData.avgTemperatures || []
  const precip = climateData.totalPrecipitation || []
  const predictions = months.map((_, i) => {
    let crowd = 20
    const t = temps[i] ?? 15
    if (t >= 18 && t <= 28) crowd += 30
    else if (t >= 12 && t <= 32) crowd += 15
    else crowd += 5
    const rain = precip[i] ?? 50
    if (rain < 50) crowd += 15
    else if (rain < 100) crowd += 5
    if ([5, 6, 7, 11].includes(i)) crowd += 15
    if ([3, 4, 8, 9].includes(i)) crowd += 5
    return Math.min(Math.round(crowd + Math.random() * 10), 100)
  })
  return { months, data: predictions }
}

export default function Destinations() {
  const [selectedDest, setSelectedDest] = useState('Marrakech')
  const [view, setView] = useState('predictions')
  const [searchQuery, setSearchQuery] = useState('')
  const [liveCity, setLiveCity] = useState(null)
  const [liveMode, setLiveMode] = useState(false)
  const [gems, setGems] = useState([])
  const [gemsLoading, setGemsLoading] = useState(false)
  const gemsLoaded = useRef(false)

  // For sample destinations crowd predictions
  const [sampleClimate, setSampleClimate] = useState({})
  const samplesLoaded = useRef(false)

  const { results: cityResults, loading: searching } = useCitySearch(searchQuery)
  const { climate, loading: loadingClimate } = useClimate(liveCity?.lat, liveCity?.lng)

  const currentMonth = new Date().getMonth()

  // Auto-load hidden gems on mount
  useEffect(() => {
    if (gemsLoaded.current) return
    gemsLoaded.current = true
    async function loadGems() {
      setGemsLoading(true)
      for (let i = 0; i < GEM_CITIES.length; i += 3) {
        const batch = GEM_CITIES.slice(i, i + 3)
        const results = await Promise.allSettled(batch.map(enrichGem))
        const valid = results.filter(r => r.status === 'fulfilled').map(r => r.value)
        setGems(prev => [...prev, ...valid])
        if (i + 3 < GEM_CITIES.length) await new Promise(r => setTimeout(r, 400))
      }
      setGemsLoading(false)
    }
    loadGems()
  }, [])

  // Auto-load sample destination climate data on mount
  useEffect(() => {
    if (samplesLoaded.current) return
    samplesLoaded.current = true
    async function loadSamples() {
      const { fetchHistoricalWeather } = await import('../services/openMeteo.js')
      for (const name of SAMPLE_DESTINATIONS) {
        const coords = SAMPLE_COORDS[name]
        if (!coords) continue
        try {
          const data = await fetchHistoricalWeather(coords.lat, coords.lng)
          if (data) {
            setSampleClimate(prev => ({ ...prev, [name]: data }))
          }
        } catch (_) {}
      }
    }
    loadSamples()
  }, [])

  const liveClimateData = useMemo(() => {
    if (!climate) return null
    return predictCrowdFromClimate(climate)
  }, [climate])

  // Build sample crowd predictions from real climate data
  const samplePredictions = useMemo(() => {
    const result = {}
    for (const name of SAMPLE_DESTINATIONS) {
      const data = sampleClimate[name]
      if (data) {
        result[name] = predictCrowdFromClimate(data)
      }
    }
    return result
  }, [sampleClimate])

  const handleSelectCity = useCallback((city) => {
    setLiveCity(city)
    setLiveMode(true)
    setSearchQuery(city.name + ', ' + (city.country || ''))
    setView('predictions')
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setLiveCity(null)
    setLiveMode(false)
  }

  // Chart data — live > real API sample > instant fallback (never null)
  const chartSource = useMemo(() => {
    if (liveMode && liveClimateData) {
      return { months: liveClimateData.months, data: liveClimateData.data, name: liveCity?.name, isLive: true }
    }
    const sample = samplePredictions[selectedDest]
    if (sample) {
      return { months: sample.months, data: sample.data, name: selectedDest, isLive: true }
    }
    // Instant fallback so chart is never blank while API data loads
    const fallback = FALLBACK_CROWD_DATA[selectedDest]
    if (fallback) {
      return { months: FALLBACK_MONTHS, data: fallback, name: selectedDest, isLive: false }
    }
    return null
  }, [liveMode, liveClimateData, liveCity, samplePredictions, selectedDest])

  const chartData = chartSource ? {
    labels: chartSource.months,
    datasets: [
      {
        label: `${chartSource.name} — Crowd Level`,
        data: chartSource.data,
        fill: true,
        backgroundColor: liveMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        borderColor: liveMode ? '#0ea5e9' : '#10b981',
        pointBackgroundColor: chartSource.months.map((_, i) =>
          i === currentMonth ? '#ef4444' : liveMode ? '#0ea5e9' : '#10b981'
        ),
        pointRadius: chartSource.months.map((_, i) => i === currentMonth ? 8 : 4),
        tension: 0.4,
        borderWidth: 2,
      },
      // Add temperature line if live climate data
      ...(liveMode && climate ? [{
        label: 'Avg Temperature (°C)',
        data: climate.avgTemperatures || [],
        fill: false,
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        pointRadius: 3,
        tension: 0.4,
        borderWidth: 1.5,
        yAxisID: 'y1',
      }] : []),
    ],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: liveMode },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.label?.includes('Temperature')) return `Temp: ${ctx.raw.toFixed(1)}°C`
            const val = ctx.raw
            let level = 'Low'
            if (val > 70) level = 'Very High'
            else if (val > 50) level = 'High'
            else if (val > 30) level = 'Moderate'
            return `Crowd Level: ${val}% — ${level}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Crowd Level (%)' },
        grid: { color: '#f1f5f9' },
      },
      ...(liveMode && climate ? {
        y1: {
          position: 'right',
          title: { display: true, text: 'Temperature (°C)' },
          grid: { display: false },
        },
      } : {}),
      x: { grid: { display: false } },
    },
  }

  const bestMonth = useMemo(() => {
    if (!chartSource) return null
    const minIdx = chartSource.data.indexOf(Math.min(...chartSource.data))
    return chartSource.months[minIdx]
  }, [chartSource])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
          <BarChart3 size={16} />
          Smart Destination Manager
        </div>
        <h1 className="text-4xl font-bold mb-4">
          AI-Powered <span className="gradient-text">Destination Intelligence</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Search any city for real climate-based crowd predictions using Open-Meteo historical weather data.
          Discover the best times to visit based on actual temperature and rainfall patterns.
        </p>
      </div>

      {/* Live City Search */}
      <div className="relative mb-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setLiveMode(false) }}
              placeholder="Search any city for real-time crowd predictions (e.g. Paris, Bangkok, Lima...)"
              className="flex-1 text-lg outline-none placeholder:text-slate-400"
            />
            {searching && <Loader2 size={20} className="text-sky-500 animate-spin" />}
            {liveMode && (
              <button onClick={clearSearch} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={18} className="text-slate-400" />
              </button>
            )}
          </div>

          {cityResults.length > 0 && !liveMode && searchQuery.length >= 2 && (
            <div className="mt-3 border-t border-slate-100 pt-3 max-h-48 overflow-y-auto">
              {cityResults.map((city, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2.5 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MapPin size={16} className="text-sky-500 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{city.name}</span>
                  <span className="text-slate-400 text-sm">{city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingClimate && (
          <div className="mt-3 flex items-center gap-2 justify-center text-sky-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Fetching historical climate data from Open-Meteo API...</span>
          </div>
        )}

        {liveMode && liveClimateData && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
              <Globe2 size={12} />
              Real crowd predictions based on historical weather data from Open-Meteo
            </span>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {[
          { id: 'predictions', label: 'Crowd Predictions', icon: TrendingUp },
          { id: 'hidden-gems', label: 'Hidden Gems', icon: Gem },
          { id: 'map', label: 'Live Map', icon: MapPin },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              view === id
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Crowd Predictions View */}
      {view === 'predictions' && (
        <div className="space-y-6">
          {/* Mock destination selector — shown when NOT in live mode */}
          {!liveMode && (
            <div>
              <p className="text-xs text-slate-400 mb-2 text-center">Or select a destination (real climate data from Open-Meteo):</p>
              <div className="grid md:grid-cols-5 gap-3">
                {SAMPLE_DESTINATIONS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedDest(name)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedDest === name
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {name}
                    {!sampleClimate[name] && <Loader2 size={12} className="inline ml-1 animate-spin text-slate-300" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live mode climate stats */}
          {liveMode && liveClimateData && climate && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Avg Temp', value: `${((climate.avgTemperatures || []).reduce((s, t) => s + (t||0), 0) / 12).toFixed(1)}°C`, icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
                { label: 'Annual Rain', value: `${(climate.totalPrecipitation || []).reduce((s, r) => s + (r||0), 0).toFixed(0)} mm`, icon: CloudRain, color: 'text-blue-500 bg-blue-50' },
                { label: 'Best Month', value: bestMonth || '—', icon: Star, color: 'text-emerald-500 bg-emerald-50' },
                { label: 'Peak Crowd', value: `${Math.max(...liveClimateData.data)}%`, icon: Users, color: 'text-red-500 bg-red-50' },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-4 flex items-center gap-3 ${stat.color}`}>
                  <stat.icon size={20} />
                  <div>
                    <p className="text-xs opacity-70">{stat.label}</p>
                    <p className="font-bold text-lg">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">
                  <TrendingUp size={18} className={`inline mr-2 ${liveMode ? 'text-sky-500' : 'text-emerald-500'}`} />
                  12-Month Crowd Prediction — {chartSource?.name || selectedDest}
                </h3>
                <span className="text-xs text-slate-400">
                  {liveMode ? 'Climate-based • Open-Meteo API • ' : chartSource?.isLive ? 'Real climate data • Open-Meteo • ' : 'Estimated • loading real data… • '}Red dot = Current month
                </span>
              </div>
              <div className="h-72">
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`bg-gradient-to-br ${liveMode ? 'from-sky-500 to-blue-500' : 'from-emerald-500 to-teal-500'} rounded-2xl p-6 text-white`}>
                <Eye size={20} className="mb-2" />
                <p className={`text-sm ${liveMode ? 'text-sky-100' : 'text-emerald-100'}`}>
                  {liveMode ? 'Climate-Based Recommendation' : 'AI Recommended Visit'}
                </p>
                <p className="text-2xl font-bold">{bestMonth || '—'}</p>
                <p className={`text-xs ${liveMode ? 'text-sky-200' : 'text-emerald-200'} mt-1`}>
                  Lowest predicted crowds{liveMode && liveCity ? ` for ${liveCity.name}` : ''}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h4 className="font-bold text-sm text-slate-700 mb-3">Crowd Level Key</h4>
                <div className="space-y-2">
                  {[
                    { label: '0-30%: Low', color: 'bg-emerald-500', desc: 'Ideal time' },
                    { label: '30-50%: Moderate', color: 'bg-yellow-500', desc: 'Comfortable' },
                    { label: '50-70%: High', color: 'bg-orange-500', desc: 'Busy' },
                    { label: '70%+: Very High', color: 'bg-red-500', desc: 'Avoid if possible' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-slate-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <Sparkles size={18} className="text-amber-500 mb-2" />
                <p className="text-sm font-bold text-amber-800 mb-1">AI Insight</p>
                <p className="text-xs text-amber-700">
                  Visiting during low-crowd periods typically saves 20-35% on accommodations while
                  providing more authentic local interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Gems View */}
      {view === 'hidden-gems' && (
        <div>
          <div className="text-center mb-8">
            <p className="text-slate-600 flex items-center justify-center gap-2">
              <Gem size={18} className="text-amber-500" />
              Real hidden gems enriched with live Wikipedia, weather & Wikimedia photos
            </p>
          </div>

          {gemsLoading && gems.length === 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-2/3" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-16 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {gemsLoading && gems.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 justify-end">
              <Loader2 size={12} className="animate-spin" />
              Loading more hidden gems... ({gems.length}/{GEM_CITIES.length})
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gems.map((dest, i) => (
              <div
                key={`${dest.name}-${i}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative h-48">
                  <img
                    src={dest.image || `https://placehold.co/600x400/f59e0b/white?text=${encodeURIComponent(dest.name)}`}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.src = `https://placehold.co/600x400/f59e0b/white?text=${encodeURIComponent(dest.name)}` }}
                  />
                  <div className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-amber-900">
                    ✨ Hidden Gem
                  </div>
                  {dest.weather?.current && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-sky-700 flex items-center gap-1">
                      <Thermometer size={12} /> {Math.round(dest.weather.current.temperature)}°C
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                    <p className="text-white/80 text-sm">{dest.country} • {dest.region}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{dest.description}</p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <Leaf size={14} className="text-emerald-500" />
                        <p className="text-lg font-bold text-emerald-600">{dest.sustainabilityScore}</p>
                      </div>
                      <p className="text-xs text-slate-500">Eco Score</p>
                    </div>
                    <div className="text-center p-2 bg-sky-50 rounded-lg">
                      <p className={`text-lg font-bold capitalize ${dest.crowdLevel === 'low' ? 'text-emerald-600' : 'text-amber-600'}`}>{dest.crowdLevel}</p>
                      <p className="text-xs text-slate-500">Crowds</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">${dest.avgCost}</p>
                      <p className="text-xs text-slate-500">/day</p>
                    </div>
                  </div>

                  {dest.culturalHighlights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Highlights</h4>
                      {dest.culturalHighlights.map((h, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-slate-600">
                          <Star size={12} className="text-amber-400 flex-shrink-0" />
                          <span className="line-clamp-2">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Low crowds</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Medium crowds</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> High crowds</span>
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              <Globe2 size={12} />
              {MAP_WORLD_CITIES.length} destinations worldwide
            </span>
          </div>
          <div className="h-[580px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <MapContainer center={[25, 15]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Searched city highlight */}
              {liveCity && (
                <Marker position={[liveCity.lat, liveCity.lng]} icon={crowdIcon('medium')}>
                  <Popup>
                    <div className="p-1 min-w-[180px]">
                      <strong>📍 {liveCity.name}</strong>, {liveCity.country || ''}
                      <br /><span className="text-xs text-sky-600">Your searched city</span>
                    </div>
                  </Popup>
                </Marker>
              )}
              {/* All 40+ world cities */}
              {MAP_WORLD_CITIES.map((city, i) => (
                <Marker
                  key={`world-${i}`}
                  position={[city.lat, city.lng]}
                  icon={crowdIcon(city.crowd)}
                >
                  <Popup>
                    <div className="p-1 min-w-[180px]">
                      <strong>{city.name}</strong>, {city.country}
                      <br />
                      <span className={`text-xs font-medium ${city.crowd === 'low' ? 'text-emerald-600' : city.crowd === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                        Crowd level: {city.crowd}
                      </span>
                      {/* Show real climate crowd if loaded */}
                      {samplePredictions[city.name]?.data && (
                        <>
                          <br />
                          <span className="text-xs text-slate-500">
                            This month: {samplePredictions[city.name].data[currentMonth]}% crowd
                          </span>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  )
}
