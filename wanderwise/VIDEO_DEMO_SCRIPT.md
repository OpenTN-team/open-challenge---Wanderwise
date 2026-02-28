# 🎬 WanderWise — Video Demo Script

> **Target length:** 4–5 minutes  
> **Tool:** OBS Studio / Windows Game Bar (Win+G) / Loom  
> **Resolution:** 1920×1080 (Full HD), browser maximized  
> **Browser:** Chrome (DevTools closed)  
> **Prep:** Run `npm run dev`, open `http://localhost:5173`, clear browser cache  

---

## 🎙️ Recording Tips

- Speak clearly at a moderate pace  
- Move the mouse slowly and deliberately — viewers follow your cursor  
- Wait 1-2 seconds after each page loads before narrating (let API data appear)  
- If something is loading, say *"And as you can see, the app is fetching real-time data…"* — it looks professional  
- Record in a quiet room, use a headset mic if available  

---

## SCENE 1 — Introduction + Home Page (0:00 – 0:45)

### What's on screen
Home page at `localhost:5173` — fully loaded (4 live city cards visible)

### Narration

> *"Hello everyone, welcome to WanderWise — an AI-powered sustainable tourism platform built for the Open Innovation Challenge 2026.*
>
> *WanderWise tackles a real-world problem: how do we make tourism smarter, more sustainable, and more culturally responsible? Our answer is AI-driven personalization combined with real-time data from 6 different APIs."*

### Actions
1. **[0:10]** Slowly scroll down past the hero to reveal the **4 live city cards** (Kyoto, Chefchaouen, Ljubljana, Cape Town)
2. **[0:20]** Hover over one city card — show the live temperature badge and Wikipedia extract

> *"On our home page, you already see real-time data — live weather from Open-Meteo and Wikipedia descriptions fetched on page load for four featured destinations."*

3. **[0:30]** Continue scrolling to the **5 feature module cards** and the **stats bar** (195+ Countries, Real-Time, 6 APIs)

> *"The platform has five core modules, each powered by live APIs. Let me walk you through each one."*

4. **[0:40]** Scroll to the "How WanderWise Works" section, pause briefly, then scroll back to the top

---

## SCENE 2 — AI Travel Recommender (0:45 – 1:30)

### Actions
1. **[0:45]** Click **"AI Recommender"** in the navbar

> *"First, our AI Recommender. It already loaded 20 popular destinations with real photos from Wikimedia Commons, live weather, and sustainability scores."*

2. **[0:55]** Slowly scroll to show the **destination card grid** — highlight the badges (Live Data, eco score, crowd level, $/day)

3. **[1:00]** Click the **search bar**, type **"Barcelona"** slowly, wait for autocomplete, select it

> *"I can search any city in the world. Let's try Barcelona. The system uses Nominatim geocoding, then fetches Wikipedia data, weather, country info, and photos — all in real-time."*

4. **[1:10]** Wait for the Barcelona card to appear, then **click on it** to open the **detail modal**

> *"Clicking a destination opens a detailed view — there's the AI match score, eco rating, live weather with a 7-day forecast, country information, cultural highlights, carbon footprint estimate, and AI eco tips."*

5. **[1:22]** Scroll inside the modal to show all sections, then close it

6. **[1:25]** Open the **Preferences panel** — click a few interest tags (e.g., "cultural", "food"), adjust the **budget slider**

> *"Users can filter by travel preferences, budget, and minimum sustainability score — the AI re-ranks all results in real time."*

---

## SCENE 3 — Cultural Heritage Explorer (1:30 – 2:15)

### Actions
1. **[1:30]** Click **"Heritage"** in the navbar

> *"Next, the Cultural Heritage Explorer. On page load, it fetches real heritage sites from five world hotspots — Rome, Cairo, Athens, Agra, and Mexico City — using the Overpass OpenStreetMap API."*

2. **[1:38]** Wait for the map and site list to load. Point cursor at the **map markers** (colored by category)

3. **[1:42]** Click a **marker on the map** — show the site detail panel that appears below

> *"Each site shows Wikipedia descriptions, real photos, heritage significance, current threats, and preservation efforts. All data is enriched from Wikipedia and Wikimedia Commons."*

4. **[1:52]** Click through the **category filter pills** (Architecture → Religious → Nature)

> *"We can filter by category — architecture, religious sites, natural heritage, artisan crafts."*

5. **[2:00]** Click the **search bar**, type **"Istanbul"**, select it, wait for Overpass results

> *"I can search a new city — let's try Istanbul. The app queries Overpass API for heritage sites within 25 km, then enriches each with Wikipedia data."*

6. **[2:10]** Click on one of the new Istanbul sites in the list — show the map flying to the location

---

## SCENE 4 — Sustainability Dashboard (2:15 – 3:05)

### Actions
1. **[2:15]** Click **"Sustainability"** in the navbar

> *"Our Sustainability Dashboard is the eco-intelligence core. Let me calculate a real trip's carbon footprint."*

2. **[2:22]** Click the **origin search**, type **"Paris"**, select it. Then click the **destination search**, type **"Tokyo"**, select it

> *"I'll plan a trip from Paris to Tokyo. The system automatically calculates the actual distance — you can see it's about 9,700 kilometers."*

3. **[2:32]** Adjust the **duration slider** to ~10 days

4. **[2:35]** Click **"Long Flight"** transport mode — watch the carbon result update

> *"For a long-haul flight, we're looking at about 2.3 tonnes of CO₂ — that's roughly 115 trees needed to offset. The breakdown shows transport, accommodation, and activities."*

5. **[2:45]** Point at the **doughnut chart** on the right — then point at the **bar chart**

> *"The bar chart compares all transport modes for this same route — you can see train produces 90% less carbon than flying."*

6. **[2:50]** Switch to **"Train"** mode — show the number drop dramatically

> *"Switching to train — the footprint drops to just 0.2 tonnes. This is the kind of awareness we want travelers to have."*

7. **[2:55]** Scroll down to the **Eco Tips section**

> *"At the bottom, Groq's Llama3 AI generates route-specific eco travel tips — these are tailored to the Paris-to-Tokyo train journey, not generic advice."*

---

## SCENE 5 — Smart Destination Manager (3:05 – 3:50)

### Actions
1. **[3:05]** Click **"Destinations"** in the navbar

> *"The Destination Manager provides crowd prediction intelligence."*

2. **[3:10]** You see the **Crowd Predictions** tab with a line chart. Click **"Marrakech"** then **"Tokyo"** from the sample buttons

> *"Here's a 12-month crowd prediction based on historical climate data from Open-Meteo. The red dot marks the current month. Different destinations show very different patterns — Tokyo peaks during cherry blossom season and autumn foliage."*

3. **[3:20]** Point at the **"Best Time to Visit"** card on the right sidebar

4. **[3:23]** Click the **"Hidden Gems"** tab

> *"Our Hidden Gems view surfaces destinations that are under-touristed but high in sustainability — Chefchaouen, Ljubljana, Luang Prabang, Tbilisi — each with real Wikipedia data and live weather."*

5. **[3:32]** Hover over a couple of gem cards — show the eco score, crowd level, and photo

6. **[3:36]** Click the **"Live Map"** tab

> *"The Live Map shows 40+ destinations worldwide, color-coded by crowd level — green for low, amber for medium, red for high. This gives destination managers a global overview at a glance."*

7. **[3:42]** Zoom into Europe on the map — click a marker to show the popup

8. **[3:46]** Pan to Asia, click another marker

---

## SCENE 6 — AI Travel Assistant (3:50 – 4:25)

### Actions
1. **[3:50]** Click **"AI Assistant"** in the navbar

> *"Finally, our AI Travel Assistant — powered by Groq's Llama3 large language model with real-time context injection."*

2. **[3:55]** You see the chat interface with suggested questions. Click **"Tell me about Morocco"** or type it

> *"I'll ask about Morocco. The system enriches the AI prompt with live Wikipedia and weather data before sending it to Groq — so the response includes current conditions, not just training data."*

3. **[4:05]** Wait for the AI response to stream in — point at the **provider label** ("Groq Llama3")

4. **[4:10]** Type a follow-up: **"What's the carbon footprint of flying there from Madrid?"**

> *"I can ask follow-up questions — the assistant handles destination info, sustainability, heritage, and trip planning topics, all with live data context."*

5. **[4:18]** Wait for the response, point at the formatted answer with bullet points

---

## SCENE 7 — Closing (4:25 – 4:45)

### Actions
1. **[4:25]** Navigate back to **Home** page

### Narration

> *"To summarize — WanderWise combines 6 live APIs with AI to help travelers make smarter, greener choices. No dummy data — everything you saw is fetched in real-time from Wikipedia, Open-Meteo, Overpass, Nominatim, RestCountries, and Groq AI.*
>
> *The platform promotes hidden gems over overcrowded destinations, calculates real carbon footprints, and protects cultural heritage through education.*
>
> *Thank you for watching — WanderWise: Travel Smarter, Explore Deeper."*

2. **[4:40]** End on the hero section. **Stop recording.**

---

## 📋 Pre-Recording Checklist

- [ ] `npm run dev` is running, no terminal errors  
- [ ] Browser at 100% zoom, no bookmarks bar, no extensions popups  
- [ ] Internet connection is stable (app calls 6 live APIs)  
- [ ] Microphone tested — clear audio, no echo  
- [ ] Screen resolution set to 1920×1080  
- [ ] Close all notifications (Focus Assist ON on Windows)  
- [ ] Pre-load the Home page and let it fully render before starting  
- [ ] Have this script open on a **second screen** or printed out  

## 🎞️ Post-Recording

- Trim dead air at the start and end  
- Add a title card: **"WanderWise — AI-Powered Sustainable Tourism | Open Innovation Challenge 2026"**  
- Optional: add subtle background music (royalty-free, low volume)  
- Export at 1080p, H.264, ~30fps  
- Suggested filename: `WanderWise_Demo_2026.mp4`  

---

*Script designed for the Open Innovation Challenge 2026 submission*
