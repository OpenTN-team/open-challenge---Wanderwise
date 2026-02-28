import { useState, useMemo } from 'react'
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
import { Leaf, TrendingDown, Plane, TreePine, Lightbulb, ArrowRight, Zap } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function Sustainability() {
  const [tripDays, setTripDays] = useState(7)
  const [selectedDest, setSelectedDest] = useState(destinations[0])
  const [transport, setTransport] = useState('flight')

  const transportMultipliers = {
    flight: 1.0,
    train: 0.15,
    bus: 0.25,
    car: 0.45,
    bicycle: 0.0,
  }

  const totalCarbon = useMemo(() => {
    const base = selectedDest.carbonFootprint * tripDays
    const transportExtra = transportMultipliers[transport] * tripDays * 0.5
    return (base + transportExtra).toFixed(1)
  }, [selectedDest, tripDays, transport])

  const treesNeeded = Math.ceil(totalCarbon / 0.022) // ~22kg per tree per year

  // Doughnut chart data
  const doughnutData = {
    labels: sustainabilityMetrics.categories.map((c) => c.label),
    datasets: [
      {
        data: sustainabilityMetrics.categories.map((c) => c.percentage),
        backgroundColor: sustainabilityMetrics.categories.map((c) => c.color),
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
        backgroundColor: topDests.map((d) =>
          d.id === selectedDest.id ? '#10b981' : '#cbd5e1'
        ),
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
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
          Understand and minimize the environmental footprint of your travels.
          Compare destinations, calculate carbon, and discover greener alternatives.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Carbon Calculator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              Carbon Calculator
            </h3>

            {/* Destination select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">Destination</label>
              <select
                value={selectedDest.id}
                onChange={(e) => setSelectedDest(destinations.find((d) => d.id === Number(e.target.value)))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.country}
                  </option>
                ))}
              </select>
            </div>

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
                onChange={(e) => setTripDays(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Transport */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">Transport Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(transportMultipliers).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTransport(t)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      transport === t
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'flight' && '✈️ '}
                    {t === 'train' && '🚄 '}
                    {t === 'bus' && '🚌 '}
                    {t === 'car' && '🚗 '}
                    {t === 'bicycle' && '🚲 '}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white text-center">
              <p className="text-sm text-emerald-100 mb-1">Estimated Carbon Footprint</p>
              <p className="text-4xl font-bold mb-1">{totalCarbon}</p>
              <p className="text-sm text-emerald-100 mb-4">tonnes CO₂</p>

              <div className="flex items-center justify-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2">
                <TreePine size={16} />
                <span>≈ {treesNeeded} trees needed to offset</span>
              </div>
            </div>

            {/* Eco score */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Destination Eco Score</span>
                <span className="text-lg font-bold text-emerald-600">{selectedDest.sustainabilityScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${selectedDest.sustainabilityScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carbon breakdown & comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Doughnut */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-sm text-slate-700 mb-4">Tourism Carbon Breakdown (Global Average)</h3>
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
