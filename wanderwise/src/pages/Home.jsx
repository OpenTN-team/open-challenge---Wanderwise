import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Map, Landmark, Leaf, BarChart3, MessageCircle,
  ArrowRight, Globe, Users, TreePine, Brain, ChevronRight,
  Thermometer, MapPin, Loader2
} from 'lucide-react'

// 4 featured destinations to fetch live on home page
const FEATURED = [
  { name: 'Kyoto',      country: 'Japan',        lat: 35.0116,  lng: 135.7681, emoji: '\ud83c\uddef\ud83c\uddf5' },
  { name: 'Chefchaouen', country: 'Morocco',     lat: 35.1688,  lng: -5.2636,  emoji: '\ud83c\uddf2\ud83c\udde6' },
  { name: 'Ljubljana',  country: 'Slovenia',     lat: 46.0569,  lng: 14.5058,  emoji: '\ud83c\uddf8\ud83c\uddee' },
  { name: 'Cape Town',  country: 'South Africa', lat: -33.9249, lng: 18.4241,  emoji: '\ud83c\uddff\ud83c\udde6' },
]

const features = [
  {
    icon: Sparkles,
    title: "AI Travel Recommender",
    description: "Search any city worldwide and get real-time Wikipedia, weather, and sustainability data powered by live APIs.",
    to: "/recommender",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Landmark,
    title: "Cultural Heritage Explorer",
    description: "Discover real heritage sites near any location using live Overpass API and OpenStreetMap data.",
    to: "/heritage",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Leaf,
    title: "Sustainability Dashboard",
    description: "Calculate real carbon footprint between any two cities with actual distance-based emission factors.",
    to: "/sustainability",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Smart Destination Manager",
    description: "Real weather forecasts, historical climate data, and AI crowd predictions from Open-Meteo API.",
    to: "/destinations",
    color: "from-sky-500 to-blue-500",
  },
  {
    icon: MessageCircle,
    title: "AI Travel Assistant",
    description: "Chat with AI powered by Groq LLM for real-time personalized travel advice and recommendations.",
    to: "/assistant",
    color: "from-violet-500 to-purple-500",
  },
]

const stats = [
  { icon: Globe, value: "195+", label: "Countries Searchable", color: "text-emerald-500" },
  { icon: Users, value: "Real-Time", label: "Live API Data", color: "text-sky-500" },
  { icon: TreePine, value: "Accurate", label: "Carbon Calculations", color: "text-green-500" },
  { icon: Brain, value: "6 APIs", label: "Powering Insights", color: "text-violet-500" },
]

export default function Home() {
  const [liveCards, setLiveCards] = useState([])
  const [liveLoading, setLiveLoading] = useState(true)

  useEffect(() => {
    async function fetchFeatured() {
      setLiveLoading(true)
      const results = await Promise.allSettled(
        FEATURED.map(async (city) => {
          const [wikiMod, weatherMod] = await Promise.all([
            import('../services/wikipedia.js'),
            import('../services/openMeteo.js'),
          ])
          const [wiki, weather] = await Promise.allSettled([
            wikiMod.fetchDestinationInfo(city.name, city.country),
            weatherMod.fetchWeather(city.lat, city.lng),
          ])
          return {
            ...city,
            wiki: wiki.status === 'fulfilled' ? wiki.value : null,
            weather: weather.status === 'fulfilled' ? weather.value : null,
          }
        })
      )
      setLiveCards(results.filter((r) => r.status === 'fulfilled').map((r) => r.value))
      setLiveLoading(false)
    }
    fetchFeatured()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-200 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6 animate-fade-in-up">
              <Sparkles size={16} />
              AI-Powered Real-Time Tourism Platform
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up delay-100">
              Travel <span className="gradient-text">Smarter</span>,
              <br />
              Explore <span className="gradient-text">Deeper</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
              WanderWise fetches real-time data from 6 free APIs to provide live weather,
              heritage sites, carbon calculations, and AI-powered recommendations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link
                to="/recommender"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-emerald-200 transition-all hover:-translate-y-0.5"
              >
                <Map size={20} />
                Discover Destinations
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/assistant"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all"
              >
                <MessageCircle size={20} />
                Chat with AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 z-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 text-center hover:shadow-lg transition-shadow animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={28} />
              <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Live Featured Destinations */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
              <Sparkles size={14} className="animate-pulse" />
              Live Right Now
            </div>
            <h2 className="text-3xl font-bold">
              Real-Time Destination <span className="gradient-text">Snapshots</span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Live weather &amp; Wikipedia data fetched fresh every visit — no cache, no dummy data.
            </p>
          </div>

          {liveLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-2/3" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {liveCards.map((city) => {
                const desc = city.wiki?.extract
                  ? city.wiki.extract.split('.')[0] + '.'
                  : `A remarkable destination in ${city.country}.`
                const img = city.wiki?.thumbnail || city.wiki?.originalImage
                const temp = city.weather?.current?.temperature
                return (
                  <Link
                    key={city.name}
                    to="/recommender"
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-36">
                      {img ? (
                        <img src={img} alt={city.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center text-4xl">
                          {city.emoji}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {temp != null && (
                        <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1 text-xs font-bold text-sky-700">
                          <Thermometer size={11} className="text-sky-500" />
                          {Math.round(temp)}°C
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-bold text-base leading-tight">{city.name}</p>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <MapPin size={10} /> {city.country} {city.emoji}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{desc}</p>
                      <div className="mt-3 flex items-center gap-1 text-emerald-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ChevronRight size={12} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Reimagining Tourism with <span className="gradient-text">AI</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Five integrated modules that work together to create personalized, sustainable,
            and culturally-rich travel experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Link
              key={i}
              to={feature.to}
              className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-5`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How WanderWise Works</h2>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">
              Three simple steps to smarter, more sustainable travel
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Search Any City", desc: "Type any city worldwide — Nominatim geocoding finds it with coordinates, while Wikipedia and RestCountries enrich data." },
              { step: "02", title: "Live Data Fetching", desc: "Open-Meteo provides weather, Overpass finds heritage sites, and our algorithms calculate sustainability scores in real-time." },
              { step: "03", title: "AI-Powered Insights", desc: "Get carbon footprints, crowd predictions, and chat with Groq AI for personalized recommendations." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white font-bold text-xl mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-sky-500 rounded-3xl p-12 text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Travel Smarter?</h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto">
            Join the movement toward sustainable, AI-powered tourism that protects heritage and enriches experiences.
          </p>
          <Link
            to="/recommender"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold text-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Start Your Journey
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
