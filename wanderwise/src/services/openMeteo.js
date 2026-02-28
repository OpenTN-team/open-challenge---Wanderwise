// Open-Meteo API — free, no key, generous limits
const BASE = 'https://api.open-meteo.com/v1'

// Current weather + 7-day forecast
export async function fetchWeather(lat, lng) {
  const url = `${BASE}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=7`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()
  return {
    current: {
      temperature: data.current?.temperature_2m,
      humidity: data.current?.relative_humidity_2m,
      weatherCode: data.current?.weather_code,
      windSpeed: data.current?.wind_speed_10m,
      description: weatherCodeToText(data.current?.weather_code),
      icon: weatherCodeToIcon(data.current?.weather_code),
    },
    daily: data.daily?.time?.map((date, i) => ({
      date,
      maxTemp: data.daily.temperature_2m_max[i],
      minTemp: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      weatherCode: data.daily.weather_code[i],
      description: weatherCodeToText(data.daily.weather_code[i]),
      icon: weatherCodeToIcon(data.daily.weather_code[i]),
    })) || [],
    timezone: data.timezone,
  }
}

// Historical monthly climate averages (for crowd / best-time predictions)
export async function fetchMonthlyClimate(lat, lng) {
  // Use climate API for monthly normals
  const url = `${BASE}/climate?latitude=${lat}&longitude=${lng}&models=EC_Earth3P_HR&monthly=temperature_2m_mean,precipitation_sum&start_date=2020-01-01&end_date=2020-12-31&timezone=auto`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      temperatures: data.monthly?.temperature_2m_mean || [],
      precipitation: data.monthly?.precipitation_sum || [],
    }
  } catch {
    return null
  }
}

// Alternative: historical weather for past year to derive monthly patterns
export async function fetchHistoricalWeather(lat, lng) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(endDate.getFullYear() - 1)
  
  const fmt = (d) => d.toISOString().split('T')[0]
  const url = `${BASE}/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}&timezone=auto&past_days=365`
  
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    
    // Aggregate by month
    const monthlyData = Array.from({ length: 12 }, () => ({ temps: [], precip: [] }))
    data.daily?.time?.forEach((date, i) => {
      const month = new Date(date).getMonth()
      const avgTemp = (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2
      monthlyData[month].temps.push(avgTemp)
      monthlyData[month].precip.push(data.daily.precipitation_sum[i])
    })
    
    return {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      avgTemperatures: monthlyData.map((m) => 
        m.temps.length ? +(m.temps.reduce((a, b) => a + b, 0) / m.temps.length).toFixed(1) : null
      ),
      totalPrecipitation: monthlyData.map((m) =>
        m.precip.length ? +(m.precip.reduce((a, b) => a + b, 0)).toFixed(1) : null
      ),
    }
  } catch {
    return null
  }
}

function weatherCodeToText(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Rain showers',
    81: 'Moderate showers', 82: 'Violent showers', 95: 'Thunderstorm',
  }
  return map[code] || 'Unknown'
}

function weatherCodeToIcon(code) {
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '❄️'
  if (code <= 82) return '🌧️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}
