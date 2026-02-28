import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Recommender from './pages/Recommender'
import Heritage from './pages/Heritage'
import Sustainability from './pages/Sustainability'
import Destinations from './pages/Destinations'
import Assistant from './pages/Assistant'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommender" element={<Recommender />} />
          <Route path="/heritage" element={<Heritage />} />
          <Route path="/sustainability" element={<Sustainability />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
