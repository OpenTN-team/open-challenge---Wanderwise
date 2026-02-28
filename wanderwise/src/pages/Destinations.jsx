import { useState, useMemo } from 'react'
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
import {
  BarChart3, Users, TrendingUp, Eye, MapPin, Clock, Star,
  Sparkles, ArrowRight, Gem
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

export default function Destinations() {
  const [selectedDest, setSelectedDest] = useState('Marrakech')
  const [view, setView] = useState('predictions') // predictions | hidden-gems | map

  const hiddenGems = destinations.filter((d) => d.hiddenGem)

  // Current month for highlighting
  const currentMonth = new Date().getMonth()

  const chartData = crowdPredictions.data[selectedDest]
    ? {
        labels: crowdPredictions.months,
        datasets: [
          {
            label: `${selectedDest} — Crowd Level`,
            data: crowdPredictions.data[selectedDest],
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            pointBackgroundColor: crowdPredictions.months.map((_, i) =>
              i === currentMonth ? '#ef4444' : '#10b981'
            ),
            pointRadius: crowdPredictions.months.map((_, i) =>
              i === currentMonth ? 8 : 4
            ),
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
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
      x: {
        grid: { display: false },
      },
    },
  }

  // Find best month (lowest crowd)
  const bestMonth = useMemo(() => {
    if (!crowdPredictions.data[selectedDest]) return null
    const data = crowdPredictions.data[selectedDest]
    const minIdx = data.indexOf(Math.min(...data))
    return crowdPredictions.months[minIdx]
  }, [selectedDest])

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
          Predict crowd levels, find the best times to visit, and discover
          hidden gems that offer authentic experiences without the masses.
        </p>
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
          {/* Destination selector */}
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

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">
                  <TrendingUp size={18} className="inline mr-2 text-emerald-500" />
                  12-Month Crowd Prediction — {selectedDest}
                </h3>
                <span className="text-xs text-slate-400">AI Predicted • Red dot = Current month</span>
              </div>
              <div className="h-72">
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                <Eye size={20} className="mb-2" />
                <p className="text-sm text-emerald-100">AI Recommended Visit</p>
                <p className="text-2xl font-bold">{bestMonth}</p>
                <p className="text-xs text-emerald-200 mt-1">Lowest predicted crowds</p>
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
