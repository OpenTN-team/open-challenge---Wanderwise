import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { heritageSites, heritageCategories } from '../data/mockData'
import { Landmark, Shield, AlertTriangle, Calendar, Filter } from 'lucide-react'

// Custom marker icon
const createIcon = (color) =>
  new L.DivIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>
    </div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

const categoryColors = {
  architecture: '#f59e0b',
  religious: '#8b5cf6',
  nature: '#10b981',
  artisan: '#ec4899',
}

export default function Heritage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedSite, setSelectedSite] = useState(null)

  const filteredSites =
    activeCategory === 'all'
      ? heritageSites
      : heritageSites.filter((s) => s.category === activeCategory)

  const center = selectedSite
    ? [selectedSite.lat, selectedSite.lng]
    : [30, 10]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
          <Landmark size={16} />
          Cultural Heritage Explorer
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Discover & Protect <span className="gradient-text">World Heritage</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore cultural heritage sites around the world. Learn their stories, understand
          the threats they face, and discover how responsible tourism supports preservation.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={18} className="text-slate-400 flex-shrink-0" />
        {heritageCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 h-[500px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <MapContainer
            center={center}
            zoom={3}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredSites.map((site) => (
              <Marker
                key={site.id}
                position={[site.lat, site.lng]}
                icon={createIcon(categoryColors[site.category] || '#10b981')}
                eventHandlers={{
                  click: () => setSelectedSite(site),
                }}
              >
                <Popup>
                  <div className="text-center p-1">
                    <strong className="text-sm">{site.name}</strong>
                    <br />
                    <span className="text-xs text-slate-500">{site.country}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Site List */}
        <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredSites.map((site) => (
            <button
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedSite?.id === site.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex gap-3">
                <img
                  src={site.image}
                  alt={site.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-800 truncate">{site.name}</h3>
                  <p className="text-xs text-slate-500">{site.country}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${categoryColors[site.category]}20`,
                      color: categoryColors[site.category],
                    }}
                  >
                    {site.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Site Detail */}
      {selectedSite && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="md:flex">
            <div className="md:w-2/5">
              <img
                src={selectedSite.image}
                alt={selectedSite.name}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            <div className="md:w-3/5 p-8">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${categoryColors[selectedSite.category]}20`,
                    color: categoryColors[selectedSite.category],
                  }}
                >
                  {selectedSite.category.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">{selectedSite.country}</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-3">{selectedSite.name}</h2>
              <p className="text-slate-600 mb-4">{selectedSite.description}</p>

              <div className="flex items-center gap-2 mb-4 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <Shield size={16} />
                {selectedSite.significance}
              </div>

              {/* Threats */}
              <div className="mb-4">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-600 mb-2">
                  <AlertTriangle size={14} />
                  Current Threats
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSite.threats.map((threat, i) => (
                    <span key={i} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs">
                      {threat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preservation */}
              <div className="p-4 bg-emerald-50 rounded-xl">
                <h4 className="font-semibold text-emerald-700 mb-1 text-sm">🌱 Preservation Efforts</h4>
                <p className="text-sm text-emerald-600">{selectedSite.preservation}</p>
              </div>

              {selectedSite.year > 0 && (
                <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500">
                  <Calendar size={12} />
                  Established circa {selectedSite.year} CE
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
