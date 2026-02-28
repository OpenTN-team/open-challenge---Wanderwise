import { useState, useMemo } from 'react'
import { destinations, travelPreferences } from '../data/mockData'
import { Sparkles, Leaf, Users, DollarSign, Star, MapPin, Clock, ChevronDown, Filter, ArrowUpDown } from 'lucide-react'

export default function Recommender() {
  const [selectedPrefs, setSelectedPrefs] = useState([])
  const [budget, setBudget] = useState(200)
  const [sustainabilityMin, setSustainabilityMin] = useState(0)
  const [sortBy, setSortBy] = useState('match')
  const [showFilters, setShowFilters] = useState(true)

  const togglePref = (id) => {
    setSelectedPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // AI-simulated recommendation scoring
  const recommendations = useMemo(() => {
    return destinations
      .map((dest) => {
        let score = 50 // base score

        // Category match scoring
        const matchCount = dest.category.filter((c) => selectedPrefs.includes(c)).length
        if (selectedPrefs.length > 0) {
          score += matchCount * 20
        } else {
          score += 30 // no prefs = moderate match for all
        }

        // Budget scoring
        if (dest.avgCost <= budget) {
          score += 15
        } else {
          score -= (dest.avgCost - budget) / 5
        }

        // Sustainability bonus
        score += dest.sustainabilityScore / 5

        // Hidden gem bonus
        if (dest.hiddenGem) score += 10

        // Low crowd bonus
        if (dest.crowdLevel === 'low') score += 8
        if (dest.crowdLevel === 'medium') score += 4

        const matchScore = Math.min(Math.round(score), 99)
        return { ...dest, matchScore }
      })
      .filter((d) => d.sustainabilityScore >= sustainabilityMin)
      .filter((d) => d.avgCost <= budget)
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore
        if (sortBy === 'sustainability') return b.sustainabilityScore - a.sustainabilityScore
        if (sortBy === 'cost') return a.avgCost - b.avgCost
        return 0
      })
  }, [selectedPrefs, budget, sustainabilityMin, sortBy])

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
          AI-Powered Recommendations
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Find Your Perfect <span className="gradient-text">Destination</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Tell us what you love, and our AI will match you with sustainable destinations
          that align with your values and interests.
        </p>
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
          <span className="font-bold text-emerald-600">{recommendations.length}</span> destinations match your criteria
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

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((dest, i) => (
          <div
            key={dest.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Image */}
            <div className="relative h-48 bg-slate-200">
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Match badge */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Sparkles size={14} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700">{dest.matchScore}%</span>
              </div>
              {dest.hiddenGem && (
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
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{dest.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {dest.category.map((cat) => (
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
                Best time: <span className="font-medium text-slate-700">{dest.bestTime}</span>
              </div>

              {/* Eco tips preview */}
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs font-semibold text-emerald-700 mb-1">🌿 AI Eco Tip:</p>
                <p className="text-xs text-emerald-600">{dest.ecoTips[0]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No destinations match your criteria</h3>
          <p className="text-slate-500">Try adjusting your budget or sustainability filters</p>
        </div>
      )}
    </div>
  )
}
