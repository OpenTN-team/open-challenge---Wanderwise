/**
 * WanderWise AI Service — Multi-Provider LLM with Real-Time Context Enrichment
 *
 * Provider chain (automatic fallback):
 *   1. Groq API       — ultra-fast, free tier (set VITE_GROQ_API_KEY)
 *   2. Gemini API     — Google, free tier (set VITE_GEMINI_API_KEY)
 *   3. Pollinations   — 100% FREE, no API key needed, real LLM (openai model)
 *
 * Real-time enrichment: detects destination in message → fetches live
 * Wikipedia summary + Open-Meteo weather → injects into AI context so
 * every response is grounded in actual live data.
 */

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are WanderWise AI, an expert sustainable tourism assistant with deep knowledge of world destinations, cultures, and eco-travel.

Your capabilities:
- Recommend destinations based on traveler interests, budget, and sustainability values
- Provide real, specific cultural and historical insights about any place in the world
- Calculate and explain travel carbon footprints and green alternatives
- Advise on UNESCO heritage sites, local traditions, and responsible tourism
- Give practical trip planning advice (visa, best time, transport, budget)
- Answer freely about ANY question the user asks — be genuinely helpful

Response style:
- Natural, conversational, and warm — like a knowledgeable friend, not a chatbot
- Use **bold** for key facts, bullet points for lists
- Give specific names, numbers, and real details — never vague generalities
- Keep responses focused and useful (200-400 words unless more detail is requested)
- You can express opinions and make direct recommendations
- NEVER say you cannot access the internet — you receive live data as context when available

When real-time data is provided in [LIVE DATA] sections, incorporate it naturally into your response as if you researched it yourself.`

// ─── Helper: detect destination entity in a message ──────────────────────────
function extractDestination(text) {
  // Look for "about X", "in X", "visit X", "travelling to X" patterns
  const patterns = [
    /(?:about|in|visit(?:ing)?|travel(?:ling)? to|trip to|going to|explore|tell me about)\s+([A-Z][a-zA-ZÀ-ÿ\s]{2,30}?)(?:\?|,|\.|$)/i,
    /^([A-Z][a-zA-ZÀ-ÿ\s]{2,25}?)(?:\s+travel|\s+tourism|\s+trip|\s+guide|\?|$)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

// ─── Real-time context enrichment ────────────────────────────────────────────
async function fetchLiveContext(message) {
  const dest = extractDestination(message)
  if (!dest || dest.length < 3) return null

  const results = { destination: dest, wiki: null, weather: null }

  try {
    const [wikiMod, nominatimMod] = await Promise.all([
      import('./wikipedia.js'),
      import('./nominatim.js'),
    ])

    // Wikipedia summary
    const wiki = await wikiMod.fetchDestinationInfo(dest).catch(() => null)
    if (wiki?.extract) results.wiki = wiki.extract.slice(0, 800)

    // Geocode + weather
    const cities = await nominatimMod.searchCities(dest, 1).catch(() => [])
    if (cities[0]) {
      const { fetchWeather } = await import('./openMeteo.js')
      const wx = await fetchWeather(cities[0].lat, cities[0].lng).catch(() => null)
      if (wx?.current) {
        results.weather = {
          temp: Math.round(wx.current.temperature),
          condition: wx.current.description || 'Clear',
          city: cities[0].name,
          country: cities[0].country,
        }
      }
    }
  } catch (_) { /* silently skip enrichment failures */ }

  return results
}

// Build context block to inject into AI messages
function buildContextBlock(ctx) {
  if (!ctx) return ''
  const parts = [`\n\n[LIVE DATA for ${ctx.destination}]`]
  if (ctx.wiki) parts.push(`Wikipedia: ${ctx.wiki}`)
  if (ctx.weather) parts.push(`Current weather in ${ctx.weather.city}, ${ctx.weather.country}: ${ctx.weather.temp}°C, ${ctx.weather.condition}`)
  parts.push('[END LIVE DATA]')
  return parts.join('\n')
}

// ─── Format messages for different provider APIs ──────────────────────────────
function toOpenAIFormat(messages, contextBlock) {
  const formatted = messages.map((m) => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content,
  }))
  // Inject live context into last user message
  if (contextBlock && formatted.length > 0) {
    const last = formatted[formatted.length - 1]
    if (last.role === 'user') {
      formatted[formatted.length - 1] = { ...last, content: last.content + contextBlock }
    }
  }
  return formatted
}

// ─── Provider 0: OpenAI ─────────────────────────────────────────────────────
async function tryOpenAI(messages, contextBlock) {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key) return null

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...toOpenAIFormat(messages, contextBlock)],
      max_tokens: 1024,
      temperature: 0.75,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const code = body?.error?.code
    // Quota exceeded or invalid key — don't retry, skip provider silently
    if (res.status === 429 || res.status === 401 || code === 'insufficient_quota') {
      console.warn(`[WanderWise AI] OpenAI skipped: ${code || res.status}`)
      return null
    }
    console.warn('OpenAI error:', res.status, body)
    return null
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  return text ? { text, provider: 'OpenAI · GPT-4o mini' } : null
}

// ─── Provider 1: Groq ─────────────────────────────────────────────────────────
async function tryGroq(messages, contextBlock) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) return null

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...toOpenAIFormat(messages, contextBlock)],
      max_tokens: 1024,
      temperature: 0.75,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  return text ? { text, provider: 'Groq · Llama 3.3 70B' } : null
}

// ─── Provider 2: Google Gemini ────────────────────────────────────────────────
async function tryGemini(messages, contextBlock) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null

  const conversation = toOpenAIFormat(messages, contextBlock)
  const contents = conversation.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.75 },
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return text ? { text, provider: 'Google Gemini 2.0 Flash' } : null
}

// Strip any deprecation / notice banners Pollinations may inject
function cleanPollinationsText(raw) {
  if (!raw) return ''
  // Nuclear approach: if the notice marker exists, take everything AFTER it
  const noticeEnd = 'will continue to work normally.'
  const idx = raw.indexOf(noticeEnd)
  if (idx !== -1) {
    raw = raw.slice(idx + noticeEnd.length)
  }
  // Also regex-strip any remaining ⚠️ blocks (catches variations)
  raw = raw.replace(/⚠️[\s\S]*?⚠️[^\n]*/g, '')
  raw = raw.replace(/IMPORTANT NOTICE[\s\S]*?work normally\.?/gi, '')
  return raw.trim()
}

// ─── Provider 3: Pollinations AI — always free, no key needed ─────────────────
async function tryPollinations(messages, contextBlock) {
  const conversation = toOpenAIFormat(messages, contextBlock)
  const body = {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation],
    model: 'mistral',  // mistral doesn't trigger the authenticated-user deprecation path
  }

  // Attempt A: OpenAI-compatible JSON endpoint
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      const text = cleanPollinationsText(data?.choices?.[0]?.message?.content)
      if (text) return { text, provider: 'Pollinations AI · GPT-4o' }
    } else {
      console.warn('Pollinations /openai status:', res.status)
    }
  } catch (e) {
    console.warn('Pollinations /openai failed:', e.message)
  }

  // Attempt B: plain text endpoint — strip the notice from response
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const raw = await res.text()
      const text = cleanPollinationsText(raw)
      if (text) return { text, provider: 'Pollinations AI · GPT-4o' }
    } else {
      console.warn('Pollinations text status:', res.status)
    }
  } catch (e) {
    console.warn('Pollinations text failed:', e.message)
  }

  return null
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function chatWithAI(messages) {
  const lastMsg = messages[messages.length - 1]?.content || ''

  // Fetch live context in parallel
  const ctx = await fetchLiveContext(lastMsg).catch(() => null)
  const contextBlock = buildContextBlock(ctx)

  // Try providers in order, log failures clearly
  for (const [fn, name] of [[tryOpenAI, 'OpenAI'], [tryGroq, 'Groq'], [tryGemini, 'Gemini'], [tryPollinations, 'Pollinations']]) {
    try {
      const result = await fn(messages, contextBlock)
      if (result) {
        console.info(`[WanderWise AI] Responded via ${name}`)
        return result
      }
      console.warn(`[WanderWise AI] ${name} returned null`)
    } catch (err) {
      console.warn(`[WanderWise AI] ${name} threw:`, err)
    }
  }

  // All providers failed — return an informative local answer rather than a dead-end message
  console.error('[WanderWise AI] All providers failed. Check network / CORS in DevTools.')
  return {
    text: `I couldn't reach any AI service right now — likely a temporary network issue or CORS restriction in this environment.

**You can still get a real AI response by:**
• Adding a free **Groq API key** to your \`.env\` file → [console.groq.com](https://console.groq.com) (takes 30 seconds)
• Or a free **Gemini key** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

In the meantime, explore the other features:
• 🗺️ **Recommender** — search any city for live weather + Wikipedia data
• 🏛️ **Heritage** — find real heritage sites via OpenStreetMap
• 🌿 **Sustainability** — calculate actual carbon footprints
• 📊 **Destinations** — climate-based crowd predictions`,
    provider: 'Offline',
  }
}

export function isAIConfigured() {
  return !!(import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY)
}

export function getProviderLabel() {
  if (import.meta.env.VITE_OPENAI_API_KEY) return 'OpenAI'
  if (import.meta.env.VITE_GROQ_API_KEY) return 'Groq'
  if (import.meta.env.VITE_GEMINI_API_KEY) return 'Gemini'
  return 'Pollinations'
}

