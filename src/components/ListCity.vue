<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import DetailWeather from './DetailWeather.vue'
import { searchLocations, getWeatherData, formatWeatherData } from '../Api/weatherApi.js'
import search from '@/assets/search-city.png'
import { useToast } from 'vue-toastification'

//toast notification
const toast = useToast()

// Search state
const searchQuery = ref('')
const selectedLocation = ref(null)

// Search state
const searchResults = ref([])
const isSearching = ref(false)
const searchError = ref(null)

// Local storage state
const savedLocations = ref([])
const isUpdating = ref(false)

// Load saved locations from localStorage
function loadSavedLocations() {
    try {
        const saved = localStorage.getItem('weather-saved-locations')
        if (saved) {
            savedLocations.value = JSON.parse(saved)
            console.log('Loaded saved locations:', savedLocations.value)
        }
    } catch (error) {
        console.error('Error loading saved locations:', error)
        savedLocations.value = []
    }
}

// Load selected location from localStorage
function loadSelectedLocation() {
    try {
        const saved = localStorage.getItem('weather-selected-location')
        if (saved) {
            const location = JSON.parse(saved)
            selectedLocation.value = location
            console.log('Loaded selected location:', location)
            // Fetch weather data for the loaded location
            fetchWeatherData(location)
        }
    } catch (error) {
        console.error('Error loading selected location:', error)
    }
}

// Save selected location to localStorage
function saveSelectedLocation(location) {
    try {
        if (location) {
            localStorage.setItem('weather-selected-location', JSON.stringify(location))
            console.log('Saved selected location:', location)
        } else {
            localStorage.removeItem('weather-selected-location')
            console.log('Removed selected location from storage')
        }
    } catch (error) {
        console.error('Error saving selected location:', error)
    }
}

// Save locations to localStorage
function saveLocationsToStorage() {
    try {
        localStorage.setItem('weather-saved-locations', JSON.stringify(savedLocations.value))
        console.log('Saved locations to storage:', savedLocations.value)
    } catch (error) {
        console.error('Error saving locations:', error)
    }
}

// Add location to saved list
async function addToSaved(location) {
    const exists = savedLocations.value.find(loc => loc.id === location.id)
    if (!exists) {
        // Add location to saved list immediately
        savedLocations.value.push(location)
        saveLocationsToStorage()
        console.log('Added to saved:', location.name)
        toast.success('Location saved successfully', {
            position: 'top-right',
            timeout: 3000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
        })
        // Fetch weather data for the newly saved location
        try {
            const weatherData = await getWeatherData(location.name, 5)
            const formattedData = formatWeatherData(weatherData)

            // Update the saved location with weather data
            const locationIndex = savedLocations.value.findIndex(loc => loc.id === location.id)
            if (locationIndex !== -1) {
                savedLocations.value[locationIndex] = {
                    ...location,
                    weatherData: formattedData
                }
                saveLocationsToStorage()
                console.log('Weather data fetched for saved location:', location.name)
            }
        } catch (error) {
            console.error('Error fetching weather data for saved location:', error)
        }
    }
}

// Remove location from saved list
function removeFromSaved(locationId) {
    savedLocations.value = savedLocations.value.filter(loc => loc.id !== locationId)
    saveLocationsToStorage()

    // If the removed location was the selected location, clear it
    if (selectedLocation.value && selectedLocation.value.id === locationId) {
        selectedLocation.value = null
        weatherData.value = null
        saveSelectedLocation(null)
    }

    toast.success('Location removed successfully', {
        position: 'top-right',
        timeout: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
    })
    console.log('Removed from saved:', locationId)
}

// Fetch weather data for a specific saved location
async function fetchWeatherForSavedLocation(location) {
    try {
        console.log('Fetching weather for saved location:', location.name)
        const weatherData = await getWeatherData(location.name, 5)
        const formattedData = formatWeatherData(weatherData)

        // Update the saved location with weather data
        const locationIndex = savedLocations.value.findIndex(loc => loc.id === location.id)
        if (locationIndex !== -1) {
            savedLocations.value[locationIndex] = {
                ...location,
                weatherData: formattedData
            }
            saveLocationsToStorage()
            console.log('Weather data fetched for saved location:', location.name)
        }
    } catch (error) {
        console.error('Error fetching weather for saved location:', error)
    }
}

// Update all saved locations weather data
async function updateSavedLocations() {
    if (isUpdating.value) return

    isUpdating.value = true
    console.log('Updating saved locations weather data...')

    try {
        const updatePromises = savedLocations.value.map(async (location) => {
            try {
                const weatherData = await getWeatherData(location.name, 5)
                return {
                    ...location,
                    weatherData: formatWeatherData(weatherData)
                }
            } catch (error) {
                console.error(`Error updating weather for ${location.name}:`, error)
                return location
            }
        })

        const updatedLocations = await Promise.all(updatePromises)
        savedLocations.value = updatedLocations
        saveLocationsToStorage()
        console.log('Updated saved locations weather data')
    } catch (error) {
        console.error('Error updating saved locations:', error)
    } finally {
        isUpdating.value = false
    }
}

// Search function
async function performSearch(query) {
    if (!query || query.trim().length < 2) {
        searchResults.value = []
        return
    }

    isSearching.value = true
    searchError.value = null

    try {
        console.log('Performing search for:', query)
        const results = await searchLocations(query)
        console.log('Search results:', results)
        searchResults.value = results || []
    } catch (error) {
        console.error('Search error:', error)
        searchError.value = error
        searchResults.value = []
    } finally {
        isSearching.value = false
    }
}

// Format time to 12-hour format with AM/PM
function formatTime(timeString) {
    if (!timeString) return ''

    try {
        const time = timeString.slice(11, 16) // Get HH:MM
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

        return `${displayHour}:${minutes} ${ampm}`
    } catch (error) {
        console.error('Error formatting time:', error)
        return timeString.slice(11, 16) // Fallback to original format
    }
}

// Watch for search query changes
watch(searchQuery, (newQuery) => {
    console.log('Search query changed to:', newQuery)
    performSearch(newQuery)
})

// Weather data state
const weatherData = ref(null)
const isWeatherLoading = ref(false)
const weatherError = ref(null)

// Weather data fetching function
async function fetchWeatherData(location) {
    if (!location) {
        weatherData.value = null
        return
    }

    isWeatherLoading.value = true
    weatherError.value = null

    try {
        console.log('Fetching weather data for:', location.name)
        const data = await getWeatherData(location.name, 5)
        console.log('Weather data:', data)

        // Format the weather data properly
        const formattedData = formatWeatherData(data)
        console.log('Formatted weather data:', formattedData)
        weatherData.value = formattedData
    } catch (error) {
        console.error('Weather data error:', error)
        weatherError.value = error
        weatherData.value = null
    } finally {
        isWeatherLoading.value = false
    }
}

// Watch for selected location changes
watch(selectedLocation, (newLocation) => {
    console.log('Selected location changed to:', newLocation)
    if (newLocation) {
        fetchWeatherData(newLocation)
    } else {
        weatherData.value = null
    }
})

// Initialize saved locations and start periodic updates
onMounted(() => {
    loadSavedLocations()
    loadSelectedLocation() // Load the previously selected location

    // Update saved locations every 3 minutes
    const updateInterval = setInterval(updateSavedLocations, 3 * 60 * 1000)

    // Initial update after 1 second
    setTimeout(updateSavedLocations, 1000)

    // Cleanup interval on component unmount
    onUnmounted(() => {
        clearInterval(updateInterval)
    })
})

// Dialog state
const showDialog = ref(false)
const selectedWeather = ref(null)

// Computed properties
const filteredSearchResults = computed(() => {
    console.log('Search results:', searchResults.value) // Debug log
    if (!searchResults.value) return []
    return searchResults.value.slice(0, 5) // Show only first 5 results
})

// Methods
function selectLocation(location) {
    selectedLocation.value = location
    searchQuery.value = location.displayName
    // Clear search results after selection
    searchQuery.value = ''
    // Save selected location to localStorage
    saveSelectedLocation(location)
}

function openDialog() {
    if (weatherData.value) {
        selectedWeather.value = weatherData.value
        showDialog.value = true
    }
}
</script>

<template>
    <div class="min-h-screen pb-8">
        <div class="max-w-lg mx-auto pt-8 px-4 sm:px-6 lg:px-8">
            <div class="flex flex-row items-center justify-between mb-6">
                <h1 class="text-4xl font-bold text-gray-50">Weather</h1>
                <span class="text-sm text-gray-200">by <a href="https://github.com/yasudaakira" target="_blank"
                        class="text-blue-700 hover:text-blue-800">Yasuda Akira</a></span>
            </div>

            <!-- Search Input -->
            <div class="relative flex items-center mb-6">
                <span class="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 text-gray-400">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </span>
                <input type="text" v-model="searchQuery" placeholder="Search for a city or airport"
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base shadow-sm" />

                <!-- Loading indicator -->
                <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
            </div>

            <!-- Search Results Dropdown -->
            <div v-if="searchQuery && filteredSearchResults.length > 0"
                class="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden overflow-y-auto max-h-[200px]">
                <div v-for="location in filteredSearchResults" :key="location.id" @click="selectLocation(location)"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div class="font-medium text-gray-900">{{ location.name }}</div>
                    <div class="text-sm text-gray-500">{{ location.country }}</div>
                </div>
            </div>

            <!-- Error Message -->
            <div v-if="searchError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                Error searching for locations: {{ searchError.message }}
            </div>

            <!-- Current Search Result -->
            <div v-if="selectedLocation && !savedLocations.find(loc => loc.id === selectedLocation.id)">
                <!-- Your result search -->
                <div class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900">Your Recently Searched Result</h2>
                            <p class="text-sm text-gray-500">Weather information for your search</p>
                        </div>
                    </div>
                </div>
                <!-- Loading state -->
                <div v-if="isWeatherLoading"
                    class="mb-4 rounded-2xl overflow-hidden shadow flex items-center min-h-[110px] relative bg-gradient-to-r from-blue-100 to-blue-300">
                    <div class="flex-1 px-5 py-4 flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span class="ml-3 text-gray-700">Loading weather data...</span>
                    </div>
                </div>


                <!-- Weather data -->
                <div v-else-if="weatherData"
                    class="bg-white mb-4 rounded-2xl overflow-hidden shadow flex items-center min-h-[110px] relative"
                    style="cursor:pointer;" @click="openDialog">
                    <!-- Save button -->
                    <button @click.stop="addToSaved(selectedLocation)"
                        class="absolute top-3 right-3 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Save location">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                    </button>

                    <span
                        class="absolute top-3 right-12 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 font-mono">
                        {{ weatherData.location.country }}
                    </span>
                    <div class="flex-1 px-5 py-4 flex flex-col justify-between">
                        <div class="flex flex-row items-center gap-2">
                            <span class="text-xl font-bold text-gray-900">{{ weatherData.location.displayName }}</span>
                            <span class="text-xs text-gray-500">{{ weatherData.location.region }}</span>
                        </div>
                        <span class="text-xs text-gray-500 mt-1">Last updated: {{
                            formatTime(weatherData.current.last_updated) }}</span>
                        <div class="flex items-center gap-2 mt-2">
                            <img v-if="weatherData.current.condition.icon" :src="weatherData.current.condition.icon"
                                :alt="weatherData.current.condition.text" class="w-10 h-10" />
                            <span class="text-gray-500 text-sm">{{ weatherData.current.condition.text }}</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end justify-center h-full pr-6 py-4 gap-1 mt-5">
                        <div class="flex flex-row items-center gap-2">
                            <span class="text-3xl font-bold text-gray-900">{{ weatherData.current.temp_c || '--' }}<span
                                    class="align-super text-xl">°</span></span>
                        </div>
                        <div class="flex flex-row items-center gap-2">
                            <span class="text-xs text-gray-500">{{ weatherData.forecast[0]?.day.mintemp_c || '--' }}° -
                                {{ weatherData.forecast[0]?.day.maxtemp_c || '--' }}°</span>
                            <span class="text-xs text-gray-500">Feels like {{ weatherData.current.feelslike_c || '--'
                                }}°</span>
                        </div>
                    </div>
                </div>

                <!-- Error state -->
                <div v-else-if="weatherError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    Error loading weather data: {{ weatherError.message }}
                </div>
            </div>

            <!-- Saved Locations -->
            <div v-if="savedLocations.length > 0" class="mb-8 overflow-y-auto max-h-[600px]">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-200">Locations</h2>
                            <p class="text-sm text-gray-100">Your favorite weather locations</p>
                        </div>
                    </div>
                    <div v-if="isUpdating"
                        class="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span class="hidden sm:inline">Updating...</span>
                        <span class="sm:hidden">...</span>
                    </div>
                </div>

                <div v-for="location in savedLocations" :key="location.id" class="mb-4">
                    <!-- Loading state -->
                    <div v-if="!location.weatherData"
                        class="rounded-2xl overflow-hidden shadow flex items-center min-h-[110px] relative bg-gradient-to-r from-blue-100 to-blue-300">
                        <div class="flex-1 px-5 py-4 flex items-center justify-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span class="ml-3 text-gray-700">Loading {{ location.name }}...</span>
                        </div>
                        <!-- Retry button -->
                        <button @click="() => fetchWeatherForSavedLocation(location)"
                            class="absolute bottom-3 right-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">
                            Retry
                        </button>
                    </div>

                    <!-- Weather data -->
                    <div v-else class="bg-white rounded-2xl overflow-hidden shadow flex items-center min-h-[110px] relative"
                        style="cursor:pointer;"
                        @click="() => { selectedWeather = location.weatherData; showDialog = true }">
                        <!-- Remove button -->
                        <button @click.stop="removeFromSaved(location.id)"
                            class="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove from saved">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <span
                            class="absolute top-3 right-12 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 font-mono">
                            {{ location.weatherData.location.country }}
                        </span>

                        <div class="flex-1 px-5 py-4 flex flex-col justify-between">
                            <div class="flex flex-row items-center gap-2">
                                <span class="text-xl font-bold text-gray-900">{{
                                    location.weatherData.location.displayName }}</span>
                                <span class="text-xs text-gray-500">{{ location.weatherData.location.region }}</span>
                            </div>
                            <div class="flex flex-row items-center gap-2">
                                <span class="text-xs text-gray-500">Last updated: {{
                                    formatTime(location.weatherData.current.last_updated) }}</span>
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <img v-if="location.weatherData.current.condition.icon"
                                    :src="location.weatherData.current.condition.icon"
                                    :alt="location.weatherData.current.condition.text" class="w-10 h-10" />
                                <span class="text-gray-500 text-sm">{{ location.weatherData.current.condition.text
                                    }}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end justify-center h-full pr-6 py-4 gap-1 mt-5">
                            <div class="flex flex-row items-center gap-2">
                                <span class="text-3xl font-bold text-gray-900">{{ location.weatherData.current.temp_c ||
                                    '--' }}<span class="align-super text-xl">°</span></span>
                            </div>
                            <div class="flex flex-row items-center gap-2">
                                <span class="text-xs text-gray-500">{{ location.weatherData.forecast[0]?.day.mintemp_c
                                    || '--' }}° - {{ location.weatherData.forecast[0]?.day.maxtemp_c || '--' }}°</span>
                                <span class="text-xs text-gray-500">Feels like {{
                                    location.weatherData.current.feelslike_c || '--' }}°</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <!-- Search City -->
            <div v-else-if="savedLocations.length === 0 && !selectedLocation">
                <img :src="search" alt="search" class="w-full h-full">
            </div>

            <DetailWeather :visible="showDialog" :weather="selectedWeather" @close="showDialog = false" />
        </div>
    </div>
</template>

<style></style>