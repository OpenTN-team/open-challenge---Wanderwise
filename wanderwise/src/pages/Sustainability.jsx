import { useState, useMemo, useCallback } from 'react'
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
import { destinations, sustainabilityMetrics } from '../data/mockData'
import { useCitySearch, useCarbonCalc } from '../hooks/useApi'
import { Leaf, TrendingDown, Plane, TreePine, Lightbulb, ArrowRight, Zap, Search, Loader2, Globe2, MapPin, X, Navigation } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function Sustainability() {
  const [tripDays, setTripDays] = useState(7)
  const [transport, setTransport] = useState('flight_medium')
  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [selectingFor, setSelectingFor] = useState(null) // 'origin' | 'destination'

  const { results: originResults, loading: searchingOrigin } = useCitySearch(originQuery)
  const { results: destResults, loading: searchingDest } = useCitySearch(destQuery)
  const { result: carbonResult, calculate: calcCarbon } = useCarbonCalc()

  // Auto calculate when params change
  const handleCalc = useCallback(async () => {
    if (!origin || !destination) return
    await calcCarbon({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      transportMode: transport,
      durationDays: tripDays,
      accommodationType: 'mid_range',
      activities: ['sightseeing', 'cultural'],
    })
  }, [origin, destination, transport, tripDays, calcCarbon])

  // Trigger calculation when origin/destination/transport/days change
  useState(() => {
    if (origin && destination) handleCalc()
  }, [origin, destination, transport, tripDays])

  const selectCity = (city, type) => {
    if (type === 'origin') {
      setOrigin(city)
      setOriginQuery(city.name + ', ' + (city.country || ''))
    } else {
      setDestination(city)
      setDestQuery(city.name + ', ' + (city.country || ''))
    }
    setSelectingFor(null)
    // Recalculate
    setTimeout(() => handleCalc(), 100)
  }

  const transportModes = [
    { id: 'flight_short', label: 'Short Flight', icon: '✈️', desc: '<1500km' },
    { id: 'flight_medium', label: 'Med Flight', icon: '✈️', desc: '1500-4000km' },
    { id: 'flight_long', label: 'Long Flight', icon: '✈️', desc: '>4000km' },
    { id: 'train', label: 'Train', icon: '🚄', desc: '90% less CO₂' },
    { id: 'bus', label: 'Bus', icon: '🚌', desc: '75% less CO₂' },
    { id: 'car', label: 'Car', icon: '🚗', desc: 'Per person' },
    { id: 'e_car', label: 'E-Car', icon: '⚡', desc: '60% less' },
    { id: 'bicycle', label: 'Bicycle', icon: '🚲', desc: 'Zero CO₂' },
  ]

  // Real distance if both cities selected
  const distance = useMemo(() => {
    if (!origin || !destination) return null
    // Haversine
    const R = 6371
    const dLat = (destination.lat - origin.lat) * Math.PI / 180
    const dLng = (destination.lng - origin.lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat*Math.PI/180) * Math.cos(destination.lat*Math.PI/180) * Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }, [origin, destination])

  const totalCarbon = carbonResult ? carbonResult.totalKg / 1000 : null
  const treesNeeded = totalCarbon ? Math.ceil((totalCarbon * 1000) / 22) : 0

  // Doughnut chart data — use real breakdown if available
  const doughnutData = {
    labels: carbonResult
      ? ['Transport', 'Accommodation', 'Activities']
      : sustainabilityMetrics.categories.map((c) => c.label),
    datasets: [
      {
        data: carbonResult
          ? [carbonResult.transport, carbonResult.accommodation, carbonResult.activities]
          : sustainabilityMetrics.categories.map((c) => c.percentage),
        backgroundColor: carbonResult
          ? ['#ef4444', '#f59e0b', '#10b981']
          : sustainabilityMetrics.categories.map((c) => c.color),
        borderWidth: 0,
        cutout: '65%',
      },
    ],
  }

  // Bar chart: sustainability scores comparison
  const topDests = [...destinations].sort((a, b) => b.sustainabilityScore - a.sustainabilityScore).slice(0, 8)
  const barData = {
    labels: topDests.map((d) => d.name),
    datasets: [
      {
        label: 'Sustainability Score',
        data: topDests.map((d) => d.sustainabilityScore),
        backgroundColor: '#10b981',
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

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
        {/* Carbon Calculator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              Real Carbon Calculator
            </h3>

            {/* Origin search */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <Navigation size={14} className="inline mr-1" />
                Origin City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => { setOriginQuery(e.target.value); setSelectingFor('origin') }}
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
                      <MapPin size={12} className="text-emerald-500" />
                      {city.name}, {city.country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination search */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Destination City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => { setDestQuery(e.target.value); setSelectingFor('destination') }}
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
                      <MapPin size={12} className="text-emerald-500" />
                      {city.name}, {city.country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Distance indicator */}
            {distance && (
              <div className="mb-4 p-2.5 bg-sky-50 rounded-lg text-sm flex items-center gap-2">
                <Globe2 size={14} className="text-sky-500" />
                <span className="text-sky-700 font-medium">{Math.round(distance).toLocaleString()} km</span>
                <span className="text-sky-500 text-xs">actual distance</span>
              </div>
            )}

            {/* Trip days */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Trip Duration: <span className="text-emerald-600 font-bold">{tripDays} days</span>
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={tripDays}
                onChange={(e) => { setTripDays(Number(e.target.value)); setTimeout(handleCalc, 50) }}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Transport */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">Transport Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {transportModes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTransport(t.id); setTimeout(handleCalc, 50) }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      transport === t.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.icon} {t.label}
                    <div className="text-[10px] opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white text-center">
              <p className="text-sm text-emerald-100 mb-1">
                {carbonResult ? 'Real Carbon Footprint' : 'Estimated Carbon Footprint'}
              </p>
              <p className="text-4xl font-bold mb-1">
                {totalCarbon !== null ? totalCarbon.toFixed(1) : '—'}
              </p>
              <p className="text-sm text-emerald-100 mb-4">tonnes CO₂</p>

              {carbonResult && (
                <div className="text-xs text-emerald-200 mb-3 space-y-1">
                  <div>Transport: {(carbonResult.transport / 1000).toFixed(2)}t</div>
                  <div>Accom: {(carbonResult.accommodation / 1000).toFixed(2)}t</div>
                  <div>Activities: {(carbonResult.activities / 1000).toFixed(2)}t</div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2">
                <TreePine size={16} />
                <span>≈ {treesNeeded} trees needed to offset</span>
              </div>

              {!origin || !destination ? (
                <p className="text-xs text-emerald-200 mt-3">
                  Select origin & destination for real calculations
                </p>
              ) : (
                <p className="text-xs text-emerald-200 mt-3 flex items-center justify-center gap-1">
                  <Globe2 size={10} /> Based on actual {Math.round(distance)} km distance
                </p>
              )}
            </div>

            {/* Sustainability score */}
            {carbonResult?.sustainabilityScore != null && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Trip Sustainability Score</span>
                  <span className="text-lg font-bold text-emerald-600">{carbonResult.sustainabilityScore}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${carbonResult.sustainabilityScore}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carbon breakdown & comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Doughnut */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-sm text-slate-700 mb-4">
                {carbonResult ? 'Your Trip Carbon Breakdown' : 'Tourism Carbon Breakdown (Global Average)'}
              </h3>
              <div className="w-48 mx-auto">
                <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-100">
                    <Plane size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">49%</p>
                    <p className="text-sm text-slate-500">of tourism CO₂ from flights</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100">
                    <TrendingDown size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">90%</p>
                    <p className="text-sm text-slate-500">less CO₂ by choosing trains</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100">
                    <TreePine size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">8%</p>
                    <p className="text-sm text-slate-500">of global CO₂ from tourism</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-700 mb-4">Sustainability Score Comparison</h3>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Eco Tips */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          <Lightbulb size={24} className="inline mr-2 text-amber-500" />
          AI-Powered Sustainability Tips
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sustainabilityMetrics.tips.map((tip, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="text-3xl">{tip.icon}</div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">{tip.title}</h4>
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <ArrowRight size={12} />
                  {tip.impact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
