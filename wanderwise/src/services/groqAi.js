// Groq AI API — free tier, very fast (needs API key)
// Set VITE_GROQ_API_KEY in .env to enable real AI responses

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `You are WanderWise AI, an expert sustainable tourism assistant. You help travelers:
- Discover destinations aligned with their interests and values
- Plan eco-friendly, carbon-conscious trips
- Learn about cultural heritage and preservation
- Find hidden gems and avoid overtourism
- Understand sustainability metrics and make informed choices

Keep responses concise, warm, and informative. Use bullet points and bold for structure.
Always consider sustainability, cultural sensitivity, and authentic local experiences.
When recommending destinations, mention eco-scores, best visit times, and practical tips.
If asked about a specific place, include cultural highlights, sustainability info, and local advice.`

export async function chatWithAI(messages) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  
  if (!apiKey) {
    // Fall back to enhanced local responses
    return getLocalResponse(messages[messages.length - 1]?.content || '')
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('Groq API error:', err)
      return getLocalResponse(messages[messages.length - 1]?.content || '')
    }
    
    const data = await res.json()
    return data.choices?.[0]?.message?.content || getLocalResponse(messages[messages.length - 1]?.content || '')
  } catch (err) {
    console.warn('Groq API failed, using local:', err)
    return getLocalResponse(messages[messages.length - 1]?.content || '')
  }
}

export function isAIConfigured() {
  return !!import.meta.env.VITE_GROQ_API_KEY
}

// Enhanced local responses when no API key is set
function getLocalResponse(message) {
  const lower = message.toLowerCase()

  if (lower.match(/hello|hi|hey|bonjour|salut|greet|start/)) {
    return `Hello! I'm your WanderWise AI travel companion 🌍

I can help you with:
• **Destination recommendations** — Ask about any country or city
• **Sustainability tips** — How to travel greener
• **Cultural heritage** — Discover world treasures
• **Budget planning** — Best value sustainable trips
• **Weather & timing** — When to visit

What destination or topic interests you?

_💡 Tip: Set your VITE_GROQ_API_KEY in .env for fully dynamic AI-powered responses!_`
  }

  if (lower.match(/morocco|maroc|chefchaouen|fes|fez|marrakech|essaouira|rabat|tangier/)) {
    return `**Morocco** is incredible for sustainable cultural tourism! 🇲🇦

**Top Sustainable Picks:**
• **Chefchaouen** — The Blue Pearl, low crowds, car-free medina (Eco Score: ~82)
• **Essaouira** — Atlantic coast, Gnaoua music, women's cooperatives (Eco: ~85)
• **Fes Medina** — World's largest car-free zone, 9,000+ alleys (Eco: ~79)

**Why It's Sustainable:**
• Most medinas are naturally pedestrian-only
• Rich tradition of handmade craftsmanship
• Riad stays directly support local families
• Farm-to-table dining is the norm

**Best Time:** March–May (pleasant, fewer tourists)
**Budget:** $40–65/day

**AI Tip:** Use the Sustainability Dashboard to calculate your exact carbon footprint for a Morocco trip!`
  }

  if (lower.match(/sustain|eco|green|carbon|environment|footprint|climate/)) {
    return `Great question about sustainable travel! Here's what the data shows: 🌿

**Top Sustainable Destinations (Real-time scores):**
1. 🇧🇹 **Bhutan** — World's only carbon-negative country (Score: ~97)
2. 🇸🇮 **Ljubljana** — Europe's greenest capital (Score: ~94)
3. 🇵🇹 **Azores** — Certified sustainable destination (Score: ~91)
4. 🇱🇦 **Luang Prabang** — Low-impact cultural tourism (Score: ~88)

**Key Impact Facts:**
• ✈️ Flights = 49% of tourism CO₂ → Take trains (90% less)
• 🏨 Eco-hotels save ~30% energy vs standard
• 🥗 Local food = 25% lower food miles
• 📅 Off-peak travel reduces overtourism AND saves 20-35% on costs

**Try our Sustainability Dashboard** to calculate your real carbon footprint!`
  }

  if (lower.match(/heritage|cultural|histor|ancient|preserve|monument|temple|museum|unesco/)) {
    return `Cultural heritage is tourism's greatest treasure — and responsibility 🏛️

**At-Risk UNESCO Sites:**
• **Fes el Bali** (Morocco) — Urban decay threatening medieval architecture
• **Angkor Wat** (Cambodia) — Mass tourism erosion + groundwater depletion
• **Galápagos** (Ecuador) — Climate change + invasive species

**How Responsible Tourism Helps:**
• 💰 Tourism funds **40% of global heritage preservation**
• 👁️ Visitor awareness drives conservation funding
• 🤝 Local guides preserve oral traditions
• 🎨 Artisan purchases sustain traditional crafts

**Best Practices:**
• Visit off-peak times → Less damage, better experience
• Hire local guides → Funds preservation + authentic stories
• Buy artisan crafts → Sustains traditional skills
• Donate to preservation funds at sites

**Explore our Heritage Map** to discover sites near any destination!`
  }

  if (lower.match(/budget|cheap|afford|cost|money|price|inexpensive|save/)) {
    return `Smart budget travel that's sustainable? Absolutely! 💰🌿

**Best Value Sustainable Destinations:**
1. 🇱🇦 **Luang Prabang** — ~$35/day (Eco: 88)
2. 🇲🇦 **Essaouira** — ~$40/day (Eco: 85)
3. 🇲🇦 **Chefchaouen** — ~$45/day (Eco: 82)
4. 🇲🇦 **Fes** — ~$50/day (Eco: 79)
5. 🇨🇱 **Valparaíso** — ~$55/day (Eco: 73)

**Money-Saving + Eco Tips:**
• 🍜 Street food = less packaging + supports locals + cheaper
• 🚶 Walk/cycle = free + zero emissions
• 📅 Shoulder season = 30-40% cheaper + fewer crowds
• 🏠 Homestays = authentic + affordable + local income
• 🗣️ Free walking tours (tip-based)

**Pro Tip:** Use our Carbon Calculator to compare trip costs vs environmental impact!`
  }

  if (lower.match(/weather|when|best time|season|temperature|rain|visit/)) {
    return `Great question! Timing makes all the difference 📅

**When to Visit Popular Destinations:**
• 🌸 **Kyoto** — Oct–Nov (autumn foliage) or Mar–Apr (cherry blossoms)
• 🏔️ **Hallstatt** — May–Sep (warm) but Jun–Aug = peak crowds
• 🇲🇦 **Morocco** — Mar–May (perfect weather, low crowds)
• 🏝️ **Azores** — Jun–Sep (warmest, whale watching)
• 🇧🇹 **Bhutan** — Mar–May (clear skies, rhododendrons)

**Shoulder Season Benefits:**
• 20-35% cheaper accommodation
• Fewer crowds = better photos & authentic interactions
• Lower environmental impact
• Often the best weather!

**Try our Destinations page** for real-time weather data and AI crowd predictions for any city!`
  }

  if (lower.match(/japan|kyoto|tokyo|osaka/)) {
    return `**Japan** offers an extraordinary blend of tradition and sustainability 🇯🇵

**Key Destinations:**
• **Kyoto** — 2000+ temples, tea ceremonies, geisha district (Eco: ~78)
• **Tokyo** — Ultra-efficient transit, incredible food scene
• **Osaka** — Street food capital, vibrant culture
• **Nara** — Ancient temples, friendly deer park

**Sustainability Highlights:**
• 🚄 Shinkansen bullet trains = world-class low-carbon transit
• ♻️ Waste separation culture is exemplary
• 🏯 Centuries of heritage preservation tradition
• 🍱 Food waste minimization is cultural norm

**Best Time:** Oct–Nov (autumn) or Mar–Apr (cherry blossoms)
**Budget:** $80-150/day

**Tip:** Rail Pass makes intercity travel both affordable and eco-friendly!`
  }

  return `That's an interesting question! Let me help you explore that 🌍

As your AI travel companion, I can assist with:
• 🗺️ **Destination Discovery** — Ask about any country or city
• 🏛️ **Cultural Heritage** — UNESCO sites, local traditions, preservation
• 🌿 **Sustainability** — Carbon footprint, eco-tips, green alternatives
• 📊 **Smart Planning** — Weather, crowds, best times to visit
• 💰 **Budget Optimization** — Best value responsible travel

**Try asking me about:**
• "Tell me about Morocco" or any destination
• "Most sustainable destinations?"
• "Best budget-friendly trips"
• "When should I visit Japan?"
• "How can I reduce my travel carbon footprint?"

_💡 For fully dynamic AI responses, add your free Groq API key to the .env file!_`
}
