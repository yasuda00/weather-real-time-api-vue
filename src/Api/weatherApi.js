// Weather API Service
// This service handles the three main API endpoints:
// 1. Search API - to find cities/locations
// 2. Current Weather API - to get current weather for a location
// 3. Forecast API - to get weather forecast for a location

// Base API configuration
const API_BASE_URL = 'https://api.weatherapi.com/v1' // Replace with your actual API base URL
const API_KEY = '4f35f087d4314cbb8a121104252607' // Store your API key in .env file

// Debug: Check if API key is available
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.warn('⚠️ Weather API key not found! Please add VITE_WEATHER_API_KEY to your .env file')
}

// API endpoints
const ENDPOINTS = {
  SEARCH: '/search.json',
  CURRENT: '/current.json',
  FORECAST: '/forecast.json',
}

// Helper function to make API calls
async function makeApiCall(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  
  // Add API key to all requests
  url.searchParams.append('key', API_KEY)
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value)
    }
  })

  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call error:', error)
    throw error
  }
}

// Search API - Find cities/locations by name
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return []
  }
  
  try {
    const results = await makeApiCall(ENDPOINTS.SEARCH, {
      q: query.trim(),
      limit: 10 // Limit results to 10 cities
    })
    
    console.log('Search results for:', query, results) // Debug log
    
    // Ensure we return an array
    if (Array.isArray(results)) {
      return results
    } else if (results && Array.isArray(results.data)) {
      return results.data
    } else {
      console.warn('Unexpected search results format:', results)
      return []
    }
  } catch (error) {
    console.error('Search API error:', error)
    return []
  }
}

// Current Weather API - Get current weather for a location
export async function getCurrentWeather(location) {
  if (!location) {
    throw new Error('Location is required')
  }
  
  return makeApiCall(ENDPOINTS.CURRENT, {
    q: location,
    aqi: 'yes' // Air quality data
  })
}

// Forecast API - Get weather forecast for a location
export async function getWeatherForecast(location, days = 5) {
  if (!location) {
    throw new Error('Location is required')
  }
  
  return makeApiCall(ENDPOINTS.FORECAST, {
    q: location,
    days: days,
    aqi: 'yes',
    alerts: 'no'
  })
}

// Combined API - Get both current weather and forecast and in one call
export async function getWeatherData(location, days = 5) {
  if (!location) {
    throw new Error('Location is required')
  }
  
  return makeApiCall(ENDPOINTS.FORECAST, {
    q: location,
    days: days,
    aqi: 'yes',
    alerts: 'no'
  })
}

// Fetch timezone info for a location
export async function getTimezone(location) {
  if (!location) throw new Error('Location is required');
  return makeApiCall(ENDPOINTS.TIMEZONE, { q: location });
}

// Helper function to format location data for consistency
export function formatLocationData(location) {
  return {
    id: location.id || `${location.name}-${location.country}`,
    name: location.name,
    country: location.country,
    region: location.region,
    lat: location.lat,
    lon: location.lon,
    displayName: location.name,
    localtime: location.localtime,
    localtime_epoch : location.localtime_epoch,
    tz_id: location.tz_id
  }
}

// Helper function to format weather data
export function formatWeatherData(weatherData) {
  if (!weatherData) return null
  
  const current = weatherData.current
  const location = weatherData.location
  const forecast = weatherData.forecast
  
  return {
    location: formatLocationData(location),
    current: {
      temp_c: current.temp_c,
      temp_f: current.temp_f,
      condition: current.condition,
      humidity: current.humidity,
      wind_kph: current.wind_kph,
      wind_mph: current.wind_mph,
      feelslike_c: current.feelslike_c,
      feelslike_f: current.feelslike_f,
      uv: current.uv,
      last_updated: current.last_updated,
      air_quality: current.air_quality,
      is_day: current.is_day
    },
    forecast: forecast?.forecastday?.map(day => ({
      date: day.date,
      day: {
        maxtemp_c: day.day.maxtemp_c,
        mintemp_c: day.day.mintemp_c,
        maxtemp_f: day.day.maxtemp_f,
        mintemp_f: day.day.mintemp_f,
        condition: day.day.condition,
        avghumidity: day.day.avghumidity,
        maxwind_kph: day.day.maxwind_kph,
        maxwind_mph: day.day.maxwind_mph,
        uv: day.day.uv
      },
      hour: day.hour?.map(hour => ({
        time: hour.time,
        temp_c: hour.temp_c,
        temp_f: hour.temp_f,
        condition: hour.condition,
        humidity: hour.humidity,
        wind_kph: hour.wind_kph,
        wind_mph: hour.wind_mph,
        feelslike_c: hour.feelslike_c,
        feelslike_f: hour.feelslike_f
      }))
    })) || []
  }
} 