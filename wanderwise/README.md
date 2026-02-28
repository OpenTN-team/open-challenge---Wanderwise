# 🌍 WanderWise — AI-Powered Sustainable Tourism Platform

> *Open Innovation Challenge 2026 — Reimagining Tourism with Artificial Intelligence*

## 🎯 Vision

WanderWise uses AI to **personalize travel experiences**, **promote cultural heritage**, **optimize destination management**, and **support sustainable tourism** — tackling concrete societal challenges through intelligent technology.

## ✨ Features

### 1. 🎯 AI Travel Recommender
- **Personalized destination matching** based on interests, budget & sustainability preferences
- Multi-factor AI scoring: category match, eco-score, budget fit, crowd level, hidden gem bonus
- 10 selectable travel preference categories
- Real-time filtering with interactive sliders
- Sorted by AI match %, sustainability, or cost

### 2. 🏛️ Cultural Heritage Explorer
- **Interactive Leaflet.js map** with categorized heritage markers
- Filter by: Architecture, Religious, Natural, Artisan Crafts
- Detailed site profiles with historical context
- **Threat analysis** — current risks to each site
- Preservation efforts and UNESCO protection status

### 3. 🌿 Sustainability Dashboard
- **Carbon footprint calculator** — by destination, duration & transport mode
- Tree offset visualization
- Interactive Chart.js doughnut & bar charts
- Destination eco-score comparison rankings
- AI-powered sustainability tips with measured impact

### 4. 📊 Smart Destination Manager
- **12-month AI crowd predictions** with Line charts
- Best visit month recommendation
- **Hidden Gems discovery** — AI-curated low-crowd, high-eco destinations
- Real-time crowd level map (color-coded markers)
- Cultural highlights per destination

### 5. 🤖 AI Travel Assistant
- **Conversational chatbot** with NLP-based intent detection
- Context-aware responses about destinations, sustainability, heritage, budget
- Typing indicators and natural conversation flow
- Suggested questions for discovery
- Rich formatted responses with bullet points and highlights

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool + HMR |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router v7** | SPA navigation |
| **Leaflet + React-Leaflet** | Interactive maps |
| **Chart.js + react-chartjs-2** | Data visualization |
| **Lucide React** | Icon system |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` after starting the dev server.

## 📁 Project Structure

```
wanderwise/
├── public/
│   ├── presentation.html      # 10-slide HTML presentation
│   └── wanderwise-icon.svg    # App icon
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation with mobile menu
│   │   └── Footer.jsx         # Site footer
│   ├── data/
│   │   └── mockData.js        # 12 destinations, heritage sites, chat responses
│   ├── pages/
│   │   ├── Home.jsx           # Landing page with hero & features
│   │   ├── Recommender.jsx    # AI travel recommendation engine
│   │   ├── Heritage.jsx       # Cultural heritage map explorer
│   │   ├── Sustainability.jsx # Eco dashboard & carbon calculator
│   │   ├── Destinations.jsx   # Smart crowd predictions & hidden gems
│   │   └── Assistant.jsx      # AI chatbot interface
│   ├── App.jsx                # Route configuration
│   ├── main.jsx               # React entry point
│   └── index.css              # Tailwind + custom styles
├── index.html
├── vite.config.js
└── package.json
```

## 📊 Presentation

Open `presentation.html` from the `public/` folder (or visit `/presentation.html` when the dev server is running). Navigate with arrow keys or click left/right halves of the screen.

**10 slides covering:**
1. Title & vision
2. Problem: Unsustainable tourism
3. Solution overview
4. AI Recommender deep-dive
5. Heritage Explorer deep-dive
6. Sustainability Dashboard deep-dive
7. Smart Destinations deep-dive
8. AI Assistant deep-dive
9. Technical architecture & roadmap
10. Impact & thank you

## 🌱 Sustainability Impact

- Promotes **low-carbon travel alternatives** (trains over flights: 90% CO₂ reduction)
- Highlights **hidden gems** to distribute tourism away from overcrowded sites
- Educates travelers on **cultural heritage preservation**
- Provides **data-driven insights** for destination management organizations
- Carbon calculator raises awareness of individual travel impact

## 📌 Expected Deliverables

- ✅ **Mock-up** — Full UI design with modern glass-morphism aesthetic
- ✅ **Application** — Functional React SPA with 5 core modules
- ✅ **Prototype** — Working AI recommendation engine & chatbot
- ✅ **Presentation** — 10-slide HTML presentation with keyboard navigation
- ✅ **Video Demo Ready** — App runs locally for screen recording

## 🔮 Roadmap

| Phase | Description |
|---|---|
| **Current** | Frontend prototype with simulated AI |
| **Phase 2** | Backend API (Node.js/Express) + Database |
| **Phase 3** | Real ML models for predictions & recommendations |
| **Phase 4** | Partnerships with UNESCO & tourism boards |
| **Phase 5** | React Native mobile application |

---

*Built with ❤️ for the Open Innovation Challenge 2026*
*WanderWise — Travel Smarter, Explore Deeper*
