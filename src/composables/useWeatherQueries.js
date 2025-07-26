import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { 
  searchLocations, 
  getCurrentWeather, 
  getWeatherForecast, 
  getWeatherData,
  formatLocationData,
  formatWeatherData 
} from '../Api/weatherApi.js'

// Query keys for caching
export const queryKeys = {
  search: (query) => ['weather', 'search', query],
  currentWeather: (location) => ['weather', 'current', location],
  forecast: (location, days) => ['weather', 'forecast', location, days],
  weatherData: (location, days) => ['weather', 'data', location, days]
}

// Search locations query
export function useSearchLocations(query) {
  console.log('useSearchLocations called with query:', query.value) // Debug log
  
  return useQuery({
    queryKey: ['search', query.value || '', Date.now()], // Simplified unique key
    queryFn: () => {
      console.log('queryFn called with:', query.value) // Debug log
      return searchLocations(query.value)
    },
    enabled: () => {
      const enabled = !!query.value && query.value.trim().length >= 2
      console.log('enabled check:', enabled, 'query:', query.value) // Debug log
      return enabled
    },
    staleTime: 0, // No stale time for search to ensure fresh results
    gcTime: 0, // No cache time for search to ensure fresh results
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    retry: false, // Don't retry failed searches
    refetchInterval: false,
    select: (data) => {
      if (!data || !Array.isArray(data)) return []
      return data.map(location => formatLocationData(location))
    }
  })
}

// Current weather query
export function useCurrentWeather(location) {
  return useQuery({
    queryKey: queryKeys.currentWeather(location),
    queryFn: () => getCurrentWeather(location),
    enabled: !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    select: (data) => {
      if (!data) return null
      return {
        location: formatLocationData(data.location),
        current: {
          temp_c: data.current.temp_c,
          temp_f: data.current.temp_f,
          condition: data.current.condition,
          humidity: data.current.humidity,
          wind_kph: data.current.wind_kph,
          wind_mph: data.current.wind_mph,
          feelslike_c: data.current.feelslike_c,
          feelslike_f: data.current.feelslike_f,
          uv: data.current.uv,
          last_updated: data.current.last_updated
        }
      }
    }
  })
}

// Weather forecast query
export function useWeatherForecast(location, days = 5) {
  return useQuery({
    queryKey: queryKeys.forecast(location, days),
    queryFn: () => getWeatherForecast(location, days),
    enabled: !!location,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    select: (data) => {
      if (!data || !data.forecast) return null
      return data.forecast.forecastday.map(day => ({
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
      }))
    }
  })
}

// Combined weather data query (current + forecast)
export function useWeatherData(location, days = 5) {
  return useQuery({
    queryKey: queryKeys.weatherData(location, days),
    queryFn: () => getWeatherData(location, days),
    enabled: !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    select: (data) => formatWeatherData(data)
  })
}

// Mutation to refresh weather data
export function useRefreshWeather() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ location, days = 5 }) => getWeatherData(location, days),
    onSuccess: (data, { location, days = 5 }) => {
      // Update the cache with fresh data
      queryClient.setQueryData(
        queryKeys.weatherData(location, days),
        formatWeatherData(data)
      )
      
      // Also update current weather cache
      queryClient.setQueryData(
        queryKeys.currentWeather(location),
        {
          location: formatLocationData(data.location),
          current: {
            temp_c: data.current.temp_c,
            temp_f: data.current.temp_f,
            condition: data.current.condition,
            humidity: data.current.humidity,
            wind_kph: data.current.wind_kph,
            wind_mph: data.current.wind_mph,
            feelslike_c: data.current.feelslike_c,
            feelslike_f: data.current.feelslike_f,
            uv: data.current.uv,
            last_updated: data.current.last_updated
          }
        }
      )
    }
  })
}

// Utility function to invalidate weather queries
export function useInvalidateWeatherQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateLocation: (location) => {
      queryClient.invalidateQueries({
        queryKey: ['weather', 'current', location]
      })
      queryClient.invalidateQueries({
        queryKey: ['weather', 'forecast', location]
      })
      queryClient.invalidateQueries({
        queryKey: ['weather', 'data', location]
      })
    },
    invalidateAllWeather: () => {
      queryClient.invalidateQueries({
        queryKey: ['weather']
      })
    }
  }
} 