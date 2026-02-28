import { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { heritageSites as mockSites, heritageCategories } from '../data/mockData'
import { useCitySearch } from '../hooks/useApi'
import { Landmark, Shield, AlertTriangle, Calendar, Filter, Search, Loader2, Globe2, MapPin, X } from 'lucide-react'

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
  historic: '#0ea5e9',
  monument: '#f59e0b',
  cultural: '#8b5cf6',
}

// Map controller component
function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 10, { duration: 1.5 })
  }, [center, zoom, map])
  return null
}

export default function Heritage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedSite, setSelectedSite] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveSites, setLiveSites] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [mapCenter, setMapCenter] = useState([30, 10])
  const [mapZoom, setMapZoom] = useState(3)
  const [enrichedInfo, setEnrichedInfo] = useState({})

  const { results: cityResults, loading: searching } = useCitySearch(searchQuery)

  // Fetch heritage sites from Overpass API around a location
  const fetchLiveHeritage = useCallback(async (lat, lng, cityName) => {
    setLoading(true)
    setSearchMode(true)
    setSelectedSite(null)
    setMapCenter([lat, lng])
    setMapZoom(12)

    try {
      const { fetchHeritageSites } = await import('../services/overpass.js')
      const sites = await fetchHeritageSites(lat, lng, 30)

      const formattedSites = sites.map((site, i) => ({
        id: `live-${i}-${site.id}`,
        name: site.name || `Heritage Site #${i + 1}`,
        country: cityName || '',
        lat: site.lat,
        lng: site.lng,
        category: site.category || 'historic',
        year: 0,
        description: site.description || `A heritage site near ${cityName}. ${site.heritage ? `Heritage: ${site.heritage}` : ''}`,
        significance: site.heritage || site.designation || 'Cultural heritage site',
        threats: ['Climate change', 'Urban development'],
        preservation: 'Visit responsibly and support local preservation efforts.',
        image: `https://placehold.co/600x400/f59e0b/white?text=${encodeURIComponent(site.name || 'Heritage')}`,
        isLive: true,
      }))

      setLiveSites(formattedSites)

      // Enrich first few sites with Wikipedia data
      enrichSitesWithWiki(formattedSites.slice(0, 5))
    } catch (err) {
      console.warn('Heritage fetch failed:', err)
      setLiveSites([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Enrich sites with Wikipedia descriptions and images
  const enrichSitesWithWiki = async (sites) => {
    try {
      const { fetchDestinationInfo } = await import('../services/wikipedia.js')
      for (const site of sites) {
        try {
          const info = await fetchDestinationInfo(site.name)
          if (info) {
            setEnrichedInfo((prev) => ({
              ...prev,
              [site.id]: {
                description: info.summary || site.description,
                image: info.image || site.image,
              },
            }))
          }
        } catch (e) {
          // Skip individual failures
        }
      }
    } catch (err) {
      console.warn('Wiki enrichment failed:', err)
    }
  }

  const handleSelectCity = (city) => {
    setSearchQuery(city.displayName || city.name)
    fetchLiveHeritage(city.lat, city.lng, city.name)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    setLiveSites([])
    setMapCenter([30, 10])
    setMapZoom(3)
    setSelectedSite(null)
    setEnrichedInfo({})
  }

  const currentSites = searchMode ? liveSites : mockSites
  const filteredSites =
    activeCategory === 'all'
      ? currentSites
      : currentSites.filter((s) => s.category === activeCategory)

  // Get enriched data for a site
  const getSiteData = (site) => {
    const enriched = enrichedInfo[site.id]
    return {
      ...site,
      description: enriched?.description || site.description,
      image: enriched?.image || site.image,
    }
  }

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
          Search any city to discover real heritage sites from OpenStreetMap data.
          Explore their stories and learn how responsible tourism supports preservation.
        </p>
      </div>

      {/* Live Search Bar */}
      <div className="relative mb-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city to find nearby heritage sites (e.g. Rome, Cairo, Kyoto...)"
              className="flex-1 text-lg outline-none placeholder:text-slate-400"
            />
            {searching && <Loader2 size={20} className="text-amber-500 animate-spin" />}
            {searchMode && (
              <button onClick={clearSearch} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={18} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Autocomplete */}
          {cityResults.length > 0 && !searchMode && searchQuery.length >= 2 && (
            <div className="mt-3 border-t border-slate-100 pt-3 max-h-48 overflow-y-auto">
              {cityResults.map((city, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2.5 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MapPin size={16} className="text-amber-500 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{city.name}</span>
                  <span className="text-slate-400 text-sm">{city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-3 flex items-center gap-2 justify-center text-amber-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Fetching heritage sites from Overpass API...</span>
          </div>
        )}

        {searchMode && liveSites.length > 0 && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              <Globe2 size={12} />
              {liveSites.length} heritage sites found via Overpass API + Wikipedia enrichment
            </span>
          </div>
        )}

        {searchMode && liveSites.length === 0 && !loading && (
          <div className="mt-3 text-center text-sm text-slate-500">
            No heritage sites found in this area. Try a larger city or different location.
          </div>
        )}
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
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFlyTo center={mapCenter} zoom={mapZoom} />
            {filteredSites.map((site) => (
              <Marker
                key={site.id}
                position={[site.lat, site.lng]}
                icon={createIcon(categoryColors[site.category] || '#10b981')}
                eventHandlers={{
                  click: () => setSelectedSite(getSiteData(site)),
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
          {filteredSites.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400">
              <Landmark size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{searchMode ? 'No sites match this filter' : 'Search a city to discover heritage sites'}</p>
            </div>
          )}
          {filteredSites.map((site) => {
            const siteData = getSiteData(site)
            return (
              <button
                key={site.id}
                onClick={() => {
                  setSelectedSite(siteData)
                  setMapCenter([site.lat, site.lng])
                  setMapZoom(14)
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedSite?.id === site.id
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={siteData.image}
                    alt={siteData.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                    onError={(e) => { e.target.src = `https://placehold.co/64x64/f59e0b/white?text=H` }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{siteData.name}</h3>
                    <p className="text-xs text-slate-500">{siteData.country}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${categoryColors[site.category] || '#10b981'}20`,
                          color: categoryColors[site.category] || '#10b981',
                        }}
                      >
                        {site.category}
                      </span>
                      {site.isLive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
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
