import { Heart, Github, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold">
                W
              </div>
              <span className="text-xl font-bold text-white">WanderWise</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              AI-powered sustainable tourism platform. Personalized travel that promotes 
              cultural heritage, reduces environmental impact, and creates smarter tourism ecosystems.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-emerald-400">
              <Leaf size={16} />
              <span>Committed to carbon-conscious travel</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Explore</h3>
            <div className="space-y-2 text-sm">
              <Link to="/recommender" className="block hover:text-emerald-400 transition-colors">AI Recommender</Link>
              <Link to="/heritage" className="block hover:text-emerald-400 transition-colors">Cultural Heritage</Link>
              <Link to="/sustainability" className="block hover:text-emerald-400 transition-colors">Sustainability</Link>
              <Link to="/destinations" className="block hover:text-emerald-400 transition-colors">Smart Destinations</Link>
              <Link to="/assistant" className="block hover:text-emerald-400 transition-colors">AI Assistant</Link>
            </div>
          </div>

          {/* Mission */}
          <div>
            <h3 className="text-white font-semibold mb-3">Our Mission</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>Personalize travel experiences</p>
              <p>Promote cultural heritage</p>
              <p>Optimize destination management</p>
              <p>Support sustainable tourism</p>
              <p>Data-driven decisions</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p className="flex items-center gap-1">
            Made with <Heart size={14} className="text-red-500" /> for the Open Innovation Challenge 2026
          </p>
          <p>WanderWise © 2026 — AI for Sustainable Tourism</p>
        </div>
      </div>
    </footer>
  )
}
