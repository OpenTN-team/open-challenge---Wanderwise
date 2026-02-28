import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import { useCitySearch, useCarbonCalc } from '../hooks/useApi'
import { chatWithAI } from '../services/groqAi'
import { fetchPlacePhoto } from '../services/photos'
import {
  Leaf, TrendingDown, Plane, TreePine, Lightbulb, ArrowRight, Zap,
  Loader2, Globe2, MapPin, Navigation, Thermometer, Cloud, Brain,
  ChevronRight, Info,
} from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// ─── Transport config ────────────────────────────────────────────────────────
const TRANSPORT_MODES = [
  { id: 'flight_short',  label: 'Short Flight',  icon: '✈️', desc: '<1500km',     color: '#f97316' },
  { id: 'flight_medium', label: 'Med Flight',    icon: '✈️', desc: '1500-4000km', color: '#ef4444' },
  { id: 'flight_long',   label: 'Long Flight',   icon: '✈️', desc: '>4000km',     color: '#dc2626' },
  { id: 'train',         label: 'Train',         icon: '🚄', desc: '90% less CO₂',color: '#10b981' },
  { id: 'bus',           label: 'Bus',           icon: '🚌', desc: '75% less CO₂',color: '#22c55e' },
  { id: 'car',           label: 'Car',           icon: '🚗', desc: 'Per person',  color: '#f59e0b' },
  { id: 'e_car',         label: 'E-Car',         icon: '⚡', desc: '60% less',    color: '#06b6d4' },
  { id: 'bicycle',       label: 'Bicycle',       icon: '🚲', desc: 'Zero CO₂',   color: '#8b5cf6' },
]
const TRANSPORT_FACTORS = {
  bicycle: 0.000, train: 0.041, bus: 0.089, e_car: 0.053,
  car: 0.171, flight_short: 0.255, flight_medium: 0.195, flight_long: 0.150,
}
const STATIC_TIPS = [
  { icon: '🚄', title: 'Choose trains over flights',   impact: 'Up to 90% less CO₂' },
  { icon: '🏨', title: 'Stay in eco-certified hotels', impact: '30% energy savings' },
  { icon: '🥗', title: 'Eat local seasonal food',      impact: '25% lower food miles' },
  { icon: '📅', title: 'Travel in shoulder season',    impact: 'Reduces overtourism' },
  { icon: '🤝', title: 'Support local communities',    impact: '3× economic benefit' },
  { icon: '🌱', title: 'Offset your carbon',           impact: 'Neutralize footprint' },
]

// ─── Enrich a city with Wikipedia + weather + country + real photo ───────────
async function enrichCityInfo(city) {
  const [wikiMod, weatherMod, countryMod] = await Promise.all([
    import('../services/wikipedia.js'),
    import('../services/openMeteo.js'),
    import('../services/restCountries.js'),
  ])
  const [wiki, weather, country, photo] = await Promise.allSettled([
    wikiMod.fetchDestinationInfo(city.name, city.country),
    weatherMod.fetchWeather(city.lat, city.lng),
    city.countryCode
      ? countryMod.fetchCountryByCode(city.countryCode)
      : countryMod.fetchCountryByName(city.country || ''),
    fetchPlacePhoto(city.name, city.country || ''),
  ])
  return {
    ...city,
    wiki:        wiki.status    === 'fulfilled' ? wiki.value    : null,
    weather:     weather.status === 'fulfilled' ? weather.value : null,
    countryData: country.status === 'fulfilled' ? country.value : null,
    photo:       photo.status   === 'fulfilled' ? photo.value   : null,
  }
}

// ─── City info card component ─────────────────────────────────────────────────
function CityCard({ info, label, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
        <div className="h-44 bg-slate-200" />
        <div className="p-4 space-y-2">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-14 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }
  if (!info) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
        <MapPin size={28} className="opacity-40" />
        <p className="text-sm font-medium">Select {label} city above</p>
      </div>
    )
  }
  const photo = info.photo
  const temp  = info.weather?.current?.temperature
  const cond  = info.weather?.current?.weatherText || ''
  const desc  = info.wiki?.extract
    ? info.wiki.extract.split('.').slice(0, 2).filter(Boolean).join('.') + '.'
    : `A remarkable destination in ${info.country || 'the world'}.`
  const continent  = info.countryData?.region || ''
  const capital    = info.countryData?.capital || ''
  const currencies = info.countryData?.currencies || []
  const langs      = info.countryData?.languages || []

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="relative h-44">
        {photo
          ? <img src={photo} alt={info.name} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          : null}
        <div
          className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-200 items-center justify-center text-5xl"
          style={{ display: photo ? 'none' : 'flex' }}
        >🌍</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Globe2 size={9} /> Live Data
        </div>
        {temp != null && (
          <div className="absolute top-2 right-2 bg-white/90 text-sky-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Thermometer size={12} className="text-sky-500" />{Math.round(temp)}°C
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">{label}</span>
          <h3 className="text-white font-bold text-lg leading-tight">{info.name}</h3>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <MapPin size={10} />{info.country}
            {info.countryData?.flagEmoji && <span className="ml-0.5">{info.countryData.flagEmoji}</span>}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{desc}</p>
        {info.weather?.current && (
          <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-xl text-xs">
            <Cloud size={13} className="text-sky-400 flex-shrink-0" />
            <span className="text-sky-700 font-medium">{Math.round(temp)}°C</span>
            {cond && <span className="text-sky-500 truncate">{cond}</span>}
            {info.weather.current.humidity != null && (
              <span className="text-sky-400 ml-auto flex-shrink-0">💧{info.weather.current.humidity}%</span>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {continent && <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400 text-[10px] mb-0.5">Region</div><div className="font-semibold text-slate-700 truncate">{continent}</div></div>}
          {capital && <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400 text-[10px] mb-0.5">Capital</div><div className="font-semibold text-slate-700 truncate">{capital}</div></div>}
          {currencies.length > 0 && <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400 text-[10px] mb-0.5">Currency</div><div className="font-semibold text-slate-700 truncate">{typeof currencies[0] === 'string' ? currencies[0] : Object.values(currencies[0]||{})[0] || ''}</div></div>}
          {langs.length > 0 && <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400 text-[10px] mb-0.5">Language</div><div className="font-semibold text-slate-700 truncate">{langs.slice(0,2).join(', ')}</div></div>}
        </div>
      </div>
    </div>
  )
}

export default function Sustainability() {
  const [tripDays, setTripDays]           = useState(7)
  const [transport, setTransport]         = useState('flight_medium')
  const [originQuery, setOriginQuery]     = useState('')
  const [destQuery, setDestQuery]         = useState('')
  const [origin, setOrigin]               = useState(null)
  const [destination, setDestination]     = useState(null)
  const [selectingFor, setSelectingFor]   = useState(null)
  const [originInfo, setOriginInfo]       = useState(null)
  const [destInfo, setDestInfo]           = useState(null)
  const [originLoading, setOriginLoading] = useState(false)
  const [destLoading, setDestLoading]     = useState(false)
  const [dynamicTips, setDynamicTips]     = useState(null)
  const [tipsLoading, setTipsLoading]     = useState(false)
  const tipsRoute = useRef('')

  const { results: originResults, loading: searchingOrigin } = useCitySearch(originQuery)
  const { results: destResults,   loading: searchingDest }   = useCitySearch(destQuery)
  const { result: carbonResult,   calculate: calcCarbon }    = useCarbonCalc()

  const handleCalc = useCallback(async () => {
    if (!origin || !destination) return
    await calcCarbon({
      originLat:         origin.lat,
      originLng:         origin.lng,
      destLat:           destination.lat,
      destLng:           destination.lng,
      transportMode:     transport,
      days:              tripDays,
      accommodationType: 'hotel_standard',
      foodStyle:         'food_local',
    })
  }, [origin, destination, transport, tripDays, calcCarbon])

  useEffect(() => { if (origin && destination) handleCalc() }, [origin, destination, transport, tripDays])

  // Enrich origin city with live data + real photo
  useEffect(() => {
    if (!origin) return
    setOriginLoading(true); setOriginInfo(null)
    enrichCityInfo(origin).then(setOriginInfo).catch(() => setOriginInfo(origin)).finally(() => setOriginLoading(false))
  }, [origin])

  // Enrich destination city with live data + real photo
  useEffect(() => {
    if (!destination) return
    setDestLoading(true); setDestInfo(null)
    enrichCityInfo(destination).then(setDestInfo).catch(() => setDestInfo(destination)).finally(() => setDestLoading(false))
  }, [destination])

  // Fetch AI route-specific eco tips via Groq
  useEffect(() => {
    if (!origin || !destination) return
    const key = `${origin.name}→${destination.name}→${transport}`
    if (tipsRoute.current === key) return
    tipsRoute.current = key
    const tLabel = { flight_short:'short-haul flight', flight_medium:'medium-haul flight', flight_long:'long-haul flight', train:'train', bus:'bus', car:'car', e_car:'electric car', bicycle:'bicycle' }[transport] || transport
    setTipsLoading(true); setDynamicTips(null)
    ;(async () => {
      try {
        const r = await chatWithAI([{ role:'user', content:`Give me exactly 6 specific eco-sustainability travel tips for a trip from ${origin.name}, ${origin.country} to ${destination.name}, ${destination.country} by ${tLabel}. Return ONLY valid JSON array, no markdown: [{"icon":"single emoji","title":"max 5 words","impact":"one key stat"}]. Be specific to this exact route.` }])
        const text = typeof r === 'string' ? r : r.text || ''
        const m = text.match(/\[[\s\S]*?\]/)
        if (m) { const t = JSON.parse(m[0]); if (Array.isArray(t) && t.length) { setDynamicTips(t.slice(0,6)); setTipsLoading(false); return } }
      } catch (_) {}
      setDynamicTips(null); setTipsLoading(false)
    })()
  }, [origin, destination, transport])

  const selectCity = (city, type) => {
    if (type === 'origin') { setOrigin(city); setOriginQuery(city.name + ', ' + (city.country || '')) }
    else { setDestination(city); setDestQuery(city.name + ', ' + (city.country || '')) }
    setSelectingFor(null)
  }

  // Real distance if both cities selected (Haversine)
  const distance = useMemo(() => {
    if (!origin || !destination) return null
    const R = 6371
    const dLat = (destination.lat - origin.lat) * Math.PI / 180
    const dLng = (destination.lng - origin.lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat*Math.PI/180) * Math.cos(destination.lat*Math.PI/180) * Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }, [origin, destination])

  const totalCarbon = carbonResult ? carbonResult.totalTonnes : null
  const treesNeeded = carbonResult ? carbonResult.treesToOffset : 0

  const doughnutData = {
    labels: ['Transport', 'Accommodation', 'Activities'],
    datasets: [{
      data: carbonResult
        ? [carbonResult.transportCarbon, carbonResult.accommodationCarbon, carbonResult.activityCarbon]
        : [49, 38, 13],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
      borderWidth: 0,
      cutout: '65%',
    }],
  }

  const compareDistance = distance || 343
  const routeLabel = origin && destination
    ? `${origin.name} → ${destination.name} (${Math.round(compareDistance)} km)`
    : 'Paris → London (343 km — select cities above for your route)'

  const CMP_MODES = [
    { id:'bicycle',       label:'🚲 Bicycle',     color:'#8b5cf6' },
    { id:'train',         label:'🚄 Train',        color:'#10b981' },
    { id:'bus',           label:'🚌 Bus',          color:'#22c55e' },
    { id:'e_car',         label:'⚡ E-Car',        color:'#06b6d4' },
    { id:'car',           label:'🚗 Car',          color:'#f59e0b' },
    { id:'flight_short',  label:'✈️ Short Flight', color:'#f97316' },
    { id:'flight_medium', label:'✈️ Med Flight',   color:'#ef4444' },
    { id:'flight_long',   label:'✈️ Long Flight',  color:'#dc2626' },
  ]
  const barData = {
    labels: CMP_MODES.map(t => t.label),
    datasets: [{
      label: `CO₂ (kg) — ${routeLabel}`,
      data: CMP_MODES.map(t => +(compareDistance * TRANSPORT_FACTORS[t.id]).toFixed(1)),
      backgroundColor: CMP_MODES.map(t => t.color),
      borderRadius: 8,
      barThickness: 28,
    }],
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y} kg CO₂`}} },
    scales: {
      y: { beginAtZero:true, grid:{color:'#f1f5f9'}, title:{display:true, text:'kg CO₂', font:{size:11}} },
      x: { grid:{display:false}, ticks:{font:{size:11}} },
    },
  }

  const tips = dynamicTips || STATIC_TIPS

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
          <Leaf size={16} />
          Sustainability Dashboard
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Track Your <span className="gradient-text">Eco Impact</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Search any two cities — we calculate real carbon footprint based on actual distance,
          transport mode, and accommodation. All emission factors are science-based.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Calculator ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              Real Carbon Calculator
            </h3>

            {/* Origin */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <Navigation size={14} className="inline mr-1" />Origin City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originQuery}
                  onChange={e => { setOriginQuery(e.target.value); setSelectingFor('origin') }}
                  onFocus={() => setSelectingFor('origin')}
                  placeholder="Where are you traveling from?"
                  className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {searchingOrigin && <Loader2 size={14} className="absolute right-2 top-3 animate-spin text-emerald-500" />}
                {origin && <span className="absolute right-2 top-2.5 text-xs text-emerald-500">✓</span>}
              </div>
              {selectingFor === 'origin' && originResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {originResults.map((city, i) => (
                    <button key={i} onClick={() => selectCity(city, 'origin')}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2">
                      <MapPin size={12} className="text-emerald-500" />{city.name}, {city.country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <MapPin size={14} className="inline mr-1" />Destination City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destQuery}
                  onChange={e => { setDestQuery(e.target.value); setSelectingFor('destination') }}
                  onFocus={() => setSelectingFor('destination')}
                  placeholder="Where are you going?"
                  className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {searchingDest && <Loader2 size={14} className="absolute right-2 top-3 animate-spin text-emerald-500" />}
                {destination && <span className="absolute right-2 top-2.5 text-xs text-emerald-500">✓</span>}
              </div>
              {selectingFor === 'destination' && destResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {destResults.map((city, i) => (
                    <button key={i} onClick={() => selectCity(city, 'destination')}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2">
                      <MapPin size={12} className="text-emerald-500" />{city.name}, {city.country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Distance badge */}
            {distance && (
              <div className="mb-4 p-2.5 bg-sky-50 rounded-lg text-sm flex items-center gap-2">
                <Globe2 size={14} className="text-sky-500" />
                <span className="text-sky-700 font-medium">{Math.round(distance).toLocaleString()} km</span>
                <span className="text-sky-500 text-xs">actual distance</span>
              </div>
            )}

            {/* Duration slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Trip Duration: <span className="text-emerald-600 font-bold">{tripDays} days</span>
              </label>
              <input type="range" min="1" max="30" value={tripDays}
                onChange={e => setTripDays(Number(e.target.value))}
                className="w-full accent-emerald-500" />
            </div>

            {/* Transport buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">Transport Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {TRANSPORT_MODES.map(t => (
                  <button key={t.id} onClick={() => setTransport(t.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${transport === t.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    style={transport === t.id ? { backgroundColor: t.color } : {}}>
                    {t.icon} {t.label}
                    <div className="text-[10px] opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result box */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white text-center">
              <p className="text-sm text-emerald-100 mb-1">
                {carbonResult ? 'Real Carbon Footprint' : 'Estimated Carbon Footprint'}
              </p>
              <p className="text-4xl font-bold mb-1">{totalCarbon !== null ? totalCarbon.toFixed(1) : '—'}</p>
              <p className="text-sm text-emerald-100 mb-4">tonnes CO₂</p>
              {carbonResult && (
                <div className="text-xs text-emerald-200 mb-3 space-y-1">
                  <div>Transport: {(carbonResult.transportCarbon / 1000).toFixed(2)}t</div>
                  <div>Accommodation: {(carbonResult.accommodationCarbon / 1000).toFixed(2)}t</div>
                  <div>Activities: {(carbonResult.activityCarbon / 1000).toFixed(2)}t</div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2">
                <TreePine size={16} />≈ {treesNeeded} trees needed to offset
              </div>
              {(!origin || !destination)
                ? <p className="text-xs text-emerald-200 mt-3">Select origin &amp; destination for real calculations</p>
                : <p className="text-xs text-emerald-200 mt-3 flex items-center justify-center gap-1"><Globe2 size={10} />Based on actual {Math.round(distance)} km</p>
              }
            </div>

            {carbonResult?.breakdown && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Trip Carbon Score</span>
                  <span className="text-lg font-bold text-emerald-600">{Math.max(0, 100 - Math.round(carbonResult.totalTonnes * 20))}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - Math.round(carbonResult.totalTonnes * 20))}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: City Cards + Charts ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* City cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <CityCard info={originInfo} label="Origin" loading={originLoading} />
            <CityCard info={destInfo}   label="Destination" loading={destLoading} />
          </div>

          {/* Carbon breakdown + quick stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-sm text-slate-700 mb-4">
                {carbonResult ? 'Your Trip Carbon Breakdown' : 'Tourism CO₂ Breakdown (Global Avg)'}
              </h3>
              <div className="w-48 mx-auto">
                <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-100"><Plane size={20} className="text-red-500" /></div>
                  <div><p className="text-2xl font-bold text-slate-800">49%</p><p className="text-sm text-slate-500">of tourism CO₂ from flights</p></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100"><TrendingDown size={20} className="text-emerald-500" /></div>
                  <div><p className="text-2xl font-bold text-slate-800">90%</p><p className="text-sm text-slate-500">less CO₂ by choosing trains</p></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100"><TreePine size={20} className="text-amber-500" /></div>
                  <div><p className="text-2xl font-bold text-slate-800">8%</p><p className="text-sm text-slate-500">of global CO₂ from tourism</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-700 mb-1">CO₂ Comparison by Transport Mode</h3>
            <p className="text-xs text-slate-400 mb-4">{routeLabel}</p>
            <div className="h-64"><Bar data={barData} options={barOptions} /></div>
          </div>
        </div>
      </div>

      {/* ── Eco Tips ── */}
      <div className="mt-12">
        <div className="flex flex-col items-center mb-8 gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {tipsLoading
              ? <><Loader2 size={22} className="animate-spin text-amber-400" />Generating AI Eco Tips…</>
              : <><Lightbulb size={24} className="text-amber-500" />{dynamicTips ? 'AI-Generated Eco Tips' : 'Sustainability Tips'}</>
            }
          </h2>
          {dynamicTips && origin && destination && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium">
              <Brain size={12} />
              AI-generated for {origin.name} → {destination.name} via {TRANSPORT_MODES.find(t=>t.id===transport)?.label}
            </div>
          )}
        </div>

        {tipsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tips.map((tip, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{tip.icon}</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <ChevronRight size={12} />{tip.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!dynamicTips && !tipsLoading && (
          <p className="text-center text-slate-400 text-xs mt-4 flex items-center justify-center gap-1">
            <Info size={12} />Select origin &amp; destination to get AI-generated route-specific tips
          </p>
        )}
      </div>
    </div>
  )
}

