// Carbon footprint calculation utilities using real distances

// Haversine formula for distance between two coordinates (km)
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

// CO₂ emissions per passenger-km (kg CO₂)
// Sources: DEFRA, ICAO, EEA
export const EMISSION_FACTORS = {
  flight_short: 0.255,     // < 1500 km
  flight_medium: 0.195,    // 1500-4000 km
  flight_long: 0.150,      // > 4000 km
  train: 0.041,
  bus: 0.089,
  car_solo: 0.171,
  car_shared: 0.085,       // 2+ passengers
  electric_car: 0.053,
  ferry: 0.115,
  bicycle: 0.0,
  walking: 0.0,
}

export function getFlightFactor(distanceKm) {
  if (distanceKm < 1500) return EMISSION_FACTORS.flight_short
  if (distanceKm < 4000) return EMISSION_FACTORS.flight_medium
  return EMISSION_FACTORS.flight_long
}

// Calculate transport carbon in kg CO₂
export function calculateTransportCarbon(distanceKm, mode = 'flight') {
  let factor
  if (mode.startsWith('flight')) {
    factor = getFlightFactor(distanceKm)
  } else {
    factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.car_solo
  }
  return +(distanceKm * factor).toFixed(1)
}

// Calculate accommodation carbon (kg CO₂ per night)
export const ACCOMMODATION_FACTORS = {
  hotel_luxury: 30.2,
  hotel_standard: 17.4,
  hotel_budget: 10.2,
  hostel: 5.8,
  airbnb: 8.1,
  camping: 2.3,
  eco_lodge: 4.5,
}

// Calculate daily activity carbon (kg CO₂ per day)
export const ACTIVITY_FACTORS = {
  food_local: 5.2,
  food_tourist: 8.7,
  food_vegan: 3.1,
  sightseeing: 2.0,
  adventure_sport: 4.5,
  shopping: 3.2,
}

// Full trip carbon estimate
export function calculateTripCarbon({
  originLat, originLng,
  destLat, destLng,
  transportMode = 'flight',
  accommodationType = 'hotel_standard',
  days = 7,
  foodStyle = 'food_local',
}) {
  const distance = haversineDistance(originLat, originLng, destLat, destLng)
  const transportCarbon = calculateTransportCarbon(distance * 2, transportMode) // round trip
  const accommodationCarbon = (ACCOMMODATION_FACTORS[accommodationType] || 17.4) * days
  const activityCarbon = (ACTIVITY_FACTORS[foodStyle] || 5.2) * days + (ACTIVITY_FACTORS.sightseeing * days)

  const total = transportCarbon + accommodationCarbon + activityCarbon

  return {
    distance: Math.round(distance),
    transportCarbon: +transportCarbon.toFixed(1),
    accommodationCarbon: +accommodationCarbon.toFixed(1),
    activityCarbon: +activityCarbon.toFixed(1),
    totalCarbon: +total.toFixed(1),
    totalTonnes: +(total / 1000).toFixed(2),
    treesToOffset: Math.ceil(total / 22), // ~22kg CO₂ per tree per year
    breakdown: [
      { label: 'Transport', value: transportCarbon, pct: +((transportCarbon / total) * 100).toFixed(0), color: '#ef4444' },
      { label: 'Accommodation', value: accommodationCarbon, pct: +((accommodationCarbon / total) * 100).toFixed(0), color: '#f59e0b' },
      { label: 'Food & Activities', value: activityCarbon, pct: +((activityCarbon / total) * 100).toFixed(0), color: '#10b981' },
    ],
  }
}

// Sustainability score heuristic based on real data
export function estimateSustainabilityScore({ tourismDensity, population, hasPublicTransit, greenSpaceRatio }) {
  let score = 60
  // Lower tourism density = better
  if (tourismDensity !== null) {
    if (tourismDensity < 50) score += 15
    else if (tourismDensity < 200) score += 8
    else if (tourismDensity > 500) score -= 10
  }
  if (hasPublicTransit) score += 10
  if (greenSpaceRatio > 0.3) score += 10
  else if (greenSpaceRatio > 0.1) score += 5
  // Normalize
  return Math.max(20, Math.min(99, score))
}
