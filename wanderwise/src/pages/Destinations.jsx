import { useState, useMemo, useCallback } from 'react'
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
import { destinations, crowdPredictions } from '../data/mockData'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useCitySearch, useClimate } from '../hooks/useApi'
import {
  BarChart3, Users, TrendingUp, Eye, MapPin, Clock, Star,
  Sparkles, ArrowRight, Gem, Search, Loader2, Globe2, Thermometer, X, CloudRain
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

// Predict crowd from climate data — hotter months + holiday months = more crowds
function predictCrowdFromClimate(climateData) {
  if (!climateData) return null
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const predictions = climateData.map((month, i) => {
    let crowd = 20
    // Temperature factor: comfortable temps = more tourists
    const t = month.avgTemp
    if (t >= 18 && t <= 28) crowd += 30
    else if (t >= 12 && t <= 32) crowd += 15
    else crowd += 5
    // Low rain = more tourists
    if (month.totalRain < 50) crowd += 15
    else if (month.totalRain < 100) crowd += 5
    // Holiday months boost
    if ([5, 6, 7, 11].includes(i)) crowd += 15 // Jun, Jul, Aug, Dec
    if ([3, 4, 8, 9].includes(i)) crowd += 5 // Apr, May, Sep, Oct
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

  const { results: cityResults, loading: searching } = useCitySearch(searchQuery)
  const { climate, loading: loadingClimate } = useClimate(liveCity?.lat, liveCity?.lng)

  const hiddenGems = destinations.filter((d) => d.hiddenGem)
  const currentMonth = new Date().getMonth()

  const liveClimateData = useMemo(() => {
    if (!climate) return null
    return predictCrowdFromClimate(climate)
  }, [climate])

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

  // Chart data — live or mock
  const chartSource = liveMode && liveClimateData
    ? { months: liveClimateData.months, data: liveClimateData.data, name: liveCity?.name }
    : crowdPredictions.data[selectedDest]
      ? { months: crowdPredictions.months, data: crowdPredictions.data[selectedDest], name: selectedDest }
      : null

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
        data: climate.map((m) => m.avgTemp),
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
              <p className="text-xs text-slate-400 mb-2 text-center">Or select a sample destination:</p>
              <div className="grid md:grid-cols-5 gap-3">
                {Object.keys(crowdPredictions.data).map((name) => (
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live mode climate stats */}
          {liveMode && liveClimateData && climate && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Avg Temp', value: `${(climate.reduce((s, m) => s + m.avgTemp, 0) / 12).toFixed(1)}°C`, icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
                { label: 'Annual Rain', value: `${climate.reduce((s, m) => s + m.totalRain, 0).toFixed(0)} mm`, icon: CloudRain, color: 'text-blue-500 bg-blue-50' },
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
                  {liveMode ? 'Climate-based • Open-Meteo API • ' : 'AI Predicted • '}Red dot = Current month
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
              AI-curated destinations with low crowds and high sustainability scores
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hiddenGems.map((dest, i) => (
              <div
                key={dest.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative h-48">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-amber-900">
                    ✨ Hidden Gem
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                    <p className="text-white/80 text-sm">{dest.country}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-600 mb-4">{dest.description}</p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">{dest.sustainabilityScore}</p>
                      <p className="text-xs text-slate-500">Eco Score</p>
                    </div>
                    <div className="text-center p-2 bg-sky-50 rounded-lg">
                      <p className="text-lg font-bold text-sky-600">{dest.crowdLevel}</p>
                      <p className="text-xs text-slate-500">Crowds</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">${dest.avgCost}</p>
                      <p className="text-xs text-slate-500">/day</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Cultural Highlights</h4>
                    {dest.culturalHighlights.map((h, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-slate-600">
                        <Star size={12} className="text-amber-400 flex-shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>
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
          </div>
          <div className="h-[550px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <MapContainer center={[30, 10]} zoom={3} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {destinations.map((dest) => (
                <Marker
                  key={dest.id}
                  position={[dest.lat, dest.lng]}
                  icon={crowdIcon(dest.crowdLevel)}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <strong>{dest.name}</strong>, {dest.country}
                      <br />
                      <span className="text-xs text-slate-500">Crowd: {dest.crowdLevel} | Eco: {dest.sustainabilityScore}/100</span>
                      <br />
                      <span className="text-xs text-emerald-600">Best time: {dest.bestTime}</span>
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
