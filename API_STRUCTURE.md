# Weather App API Structure

This document explains how the three main APIs are structured and linked together in the weather app.

## API Overview

The weather app uses three main API endpoints that work together:

1. **Search API** - Find cities/locations by name
2. **Current Weather API** - Get current weather for a location
3. **Forecast API** - Get weather forecast for a location

## API Flow

```
User Search → Search API → Location Selection → Current Weather + Forecast APIs
```

### 1. Search API (`/search.json`)
- **Purpose**: Find cities/locations by name
- **Input**: Search query (minimum 2 characters)
- **Output**: Array of location objects with coordinates
- **Usage**: Used when user types in the search box

### 2. Current Weather API (`/current.json`)
- **Purpose**: Get current weather conditions
- **Input**: Location (name, coordinates, or ID)
- **Output**: Current temperature, conditions, humidity, wind, etc.
- **Usage**: Display current weather in the main card

### 3. Forecast API (`/forecast.json`)
- **Purpose**: Get weather forecast (hourly and daily)
- **Input**: Location and number of days (default: 5)
- **Output**: Hourly and daily forecast data
- **Usage**: Display in the detail modal (hourly forecast and 5-day forecast)

## File Structure

```
src/
├── Api/
│   └── weatherApi.js          # API service functions
├── composables/
│   └── useWeatherQueries.js   # TanStack Query composables
└── components/
    ├── ListCity.vue           # Main component with search
    └── DetailWeather.vue      # Weather detail modal
```

## API Integration Flow

### Step 1: Search Implementation
```javascript
// In ListCity.vue
const { data: searchResults, isLoading: isSearching } = useSearchLocations(searchQuery)
```

### Step 2: Location Selection
```javascript
function selectLocation(location) {
  selectedLocation.value = location
  // This triggers weather data fetching
}
```

### Step 3: Weather Data Fetching
```javascript
// Automatically fetches when selectedLocation changes
const { data: weatherData, isLoading: isWeatherLoading } = useWeatherData(selectedLocation.value?.name, 5)
```

## TanStack Query Benefits

- **Automatic Caching**: Search results and weather data are cached
- **Loading States**: Built-in loading indicators
- **Error Handling**: Automatic error states
- **Background Updates**: Data refreshes automatically
- **Optimistic Updates**: UI updates immediately

## Environment Setup

Create a `.env` file in your project root:

```env
VITE_WEATHER_API_KEY=your_api_key_here
VITE_WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
```

## API Response Format

### Search Response
```javascript
[
  {
    id: "kuala-lumpur-malaysia",
    name: "Kuala Lumpur",
    country: "Malaysia",
    region: "Kuala Lumpur",
    lat: 3.1412,
    lon: 101.6865,
    displayName: "Kuala Lumpur, Malaysia"
  }
]
```

### Weather Response
```javascript
{
  location: {
    name: "Kuala Lumpur",
    country: "Malaysia",
    displayName: "Kuala Lumpur, Malaysia"
  },
  current: {
    temp_c: 32,
    condition: { text: "Sunny" },
    humidity: 65,
    wind_kph: 12
  },
  forecast: [
    {
      date: "2025-01-27",
      day: { maxtemp_c: 32, mintemp_c: 24 },
      hour: [/* hourly data */]
    }
  ]
}
```

## Usage Examples

### Search for Cities
```javascript
import { useSearchLocations } from '../composables/useWeatherQueries.js'

const { data: searchResults } = useSearchLocations('kuala')
```

### Get Weather Data
```javascript
import { useWeatherData } from '../composables/useWeatherQueries.js'

const { data: weatherData, isLoading } = useWeatherData('Kuala Lumpur', 5)
```

### Refresh Weather Data
```javascript
import { useRefreshWeather } from '../composables/useWeatherQueries.js'

const refreshWeather = useRefreshWeather()
refreshWeather.mutate({ location: 'Kuala Lumpur', days: 5 })
```

## Error Handling

The API structure includes comprehensive error handling:

- Network errors
- API rate limiting
- Invalid location errors
- Data validation errors

All errors are automatically handled by TanStack Query and displayed in the UI.

## Performance Optimizations

- **Debounced Search**: Search only triggers after user stops typing
- **Caching**: Results cached for 5-30 minutes depending on data type
- **Background Refetching**: Data automatically refreshes in background
- **Optimistic Updates**: UI updates immediately for better UX 