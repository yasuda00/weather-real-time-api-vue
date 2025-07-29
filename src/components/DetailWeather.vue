<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import dayjs from 'dayjs'

const props = defineProps({
  visible: Boolean,
  weather: Object,
})

const localTime = computed(() =>
  dayjs(props.weather?.location?.localtime)
)

const emit = defineEmits(['close'])
const emitClose = () => emit('close')

// Format time to 12-hour format with AM/PM
function formatTime(timeString) {
  if (!timeString) return ''

  try {
    const time = timeString.slice(11, 16)
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

    return `${displayHour}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return timeString.slice(11, 16)
  }
}

// Get hour display - show "Now" for current hour, then upcoming hours
function getHourDisplay(timeString, index) {
  if (!timeString || !localTime.value) return ''

  try {
    const currentHour = localTime.value.hour()
    const forecastHour = parseInt(timeString.slice(11, 13))

    if (forecastHour === currentHour && index === 0) {
      return 'Now'
    }

    return formatTime(timeString)
  } catch (error) {
    console.error('Error getting hour display:', error)
    return index === 0 ? 'Now' : formatTime(timeString)
  }
}

// Get air quality color and text
function getAirQualityInfo(aqi) {
  if (!aqi || !aqi['us-epa-index']) return { color: 'text-gray-500', bg: 'bg-gray-100', text: 'Unknown' }
  
  const index = aqi['us-epa-index']
  switch (index) {
    case 1: return { color: 'text-green-600', bg: 'bg-green-100', text: 'Good' }
    case 2: return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Moderate' }
    case 3: return { color: 'text-orange-600', bg: 'bg-orange-100', text: 'Unhealthy for Sensitive Groups' }
    case 4: return { color: 'text-red-600', bg: 'bg-red-100', text: 'Unhealthy' }
    case 5: return { color: 'text-purple-600', bg: 'bg-purple-100', text: 'Very Unhealthy' }
    case 6: return { color: 'text-red-800', bg: 'bg-red-200', text: 'Hazardous' }
    default: return { color: 'text-gray-500', bg: 'bg-gray-100', text: 'Unknown' }
  }
}

// Computed properties for weather data
const weatherData = computed(() => props.weather)
const location = computed(() => weatherData.value?.location)
const current = computed(() => weatherData.value?.current)
const forecast = computed(() => weatherData.value?.forecast || [])
const hourlyForecast = computed(() => {
  if (!localTime.value || !forecast.value.length) return []

  const todayHours = forecast.value[0]?.hour || []
  const tomorrowHours = forecast.value[1]?.hour || []
  const allHours = [...todayHours, ...tomorrowHours]

  const now = localTime.value
  const startIndex = allHours.findIndex(h => {
    return dayjs(h.time).isAfter(now) || dayjs(h.time).hour() === now.hour()
  })

  return allHours.slice(startIndex, startIndex + 6)
})
const airQuality = computed(() => current.value?.air_quality)
const airQualityInfo = computed(() => getAirQualityInfo(airQuality.value))


</script>

<template>
  <TransitionRoot :show="visible" as="template">
    <Dialog @close="emitClose" class="relative z-50">
      <TransitionChild
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40 opacity-90" aria-hidden="true" />
      </TransitionChild>
      <div class="fixed inset-0 flex w-screen items-center justify-center p-4">
        <TransitionChild
          enter="duration-300 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel class="w-full max-w-2xl lg:max-w-4xl min-h-[500px] md:min-h-[60vh] rounded-3xl bg-white p-0 overflow-hidden shadow-xl transition-all flex flex-col justify-start">
            <!-- Header Section -->
            <div class="p-4 md:p-6 pb-3 text-gray-900 relative bg-gradient-to-br from-blue-50 to-indigo-100">
              <!-- Close button -->
              <button 
                @click="emitClose"
                class="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              <DialogTitle class="text-xl md:text-3xl font-bold mb-1 text-center flex items-center justify-center gap-2">
                {{ location?.displayName || 'Location' }}
                <img 
                  v-if="current?.condition?.icon" 
                  :src="current.condition.icon" 
                  :alt="current?.condition?.text"
                  class="w-5 h-5 md:w-7 md:h-7"
                />
              </DialogTitle>

              <div class="text-sm text-center text-gray-600">
                {{ localTime?.format('dddd, MMM D • h:mm A') }}
              </div>
              
              <div class="text-6xl mt-1 md:text-6xl font-extrabold text-center text-gray-900">
                {{ Math.round(current?.temp_c || 0) }}°
              </div>
              
              <div class="text-base md:text-xl text-center mb-2 text-gray-700">
                {{ current?.condition?.text || 'Weather condition' }}
              </div>
              
              
              
              <!-- Air Quality Badge -->
              <div v-if="airQuality" class="flex justify-center mb-5">
                <div :class="`px-2 py-1 rounded-full text-xs font-medium ${airQualityInfo.bg} ${airQualityInfo.color}`">
                  Air Quality: {{ airQualityInfo.text }}
                </div>
              </div>
              
              <!-- Additional Weather Info -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div class="text-center">
                  <div class="text-xs text-gray-500">Feels Like</div>
                  <div class="text-sm font-semibold">{{ Math.round(current?.feelslike_c || 0) }}°</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">Humidity</div>
                  <div class="text-sm font-semibold">{{ current?.humidity || 0 }}%</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">Wind</div>
                  <div class="text-sm font-semibold">{{ current?.wind_kph || 0 }} km/h</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">UV Index</div>
                  <div class="text-sm font-semibold">{{ current?.uv || 0 }}</div>
                </div>
              </div>
            </div>
            <div class="px-4 md:px-6 pt-3 pb-4 flex-1 flex flex-col justify-between">
              <!-- Hourly forecast -->
              <div class="mb-4">
                <h3 class="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Hourly Forecast
                </h3>
                <div class="flex flex-row justify-between items-end gap-1 md:gap-3 overflow-x-auto pb-2">
                  <div 
                    v-for="(hour, index) in hourlyForecast.slice(0, 6)" 
                    :key="index"
                    class="flex flex-col items-center flex-shrink-0 min-w-[50px] md:min-w-[70px]"
                  >
                    <div class="text-xs text-gray-500 mb-1">
                      {{ getHourDisplay(hour.time, index) }}
                    </div>
                    <img 
                      v-if="hour.condition?.icon" 
                      :src="hour.condition.icon" 
                      :alt="hour.condition?.text"
                      class="w-5 h-5 md:w-7 md:h-7 mb-1"
                    />
                    <div class="text-xs md:text-base font-semibold text-gray-800">
                      {{ Math.round(hour.temp_c) }}°
                    </div>
                  </div>
                </div>
              </div>
              <!-- 5-day forecast -->
              <div class="bg-gray-50 rounded-xl p-3 md:p-4 shadow-sm">
                <div class="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <path d="M16 2v4M8 2v4"/>
                  </svg>
                  5-Day Forecast
                </div>
                <div class="space-y-2">
                  <div 
                    v-for="(day, index) in forecast.slice(0, 5)" 
                    :key="index"
                    class="flex items-center py-2 border-b border-gray-200 last:border-b-0"
                  >
                    <div class="w-14 md:w-18 text-xs md:text-sm font-medium text-gray-900">
                      {{ index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) }}
                    </div>
                    <div class="w-6 md:w-8 flex justify-center">
                      <img 
                        v-if="day.day?.condition?.icon" 
                        :src="day.day.condition.icon" 
                        :alt="day.day.condition?.text"
                        class="w-5 h-5 md:w-7 md:h-7"
                      />
                    </div>
                    <div class="w-8 md:w-10 text-xs md:text-sm text-gray-500 text-right">
                      {{ day.day?.mintemp_c || 0 }}<span class="align-super text-xs">°</span>
                    </div>
                    <div class="flex-1 flex items-center px-1 md:px-2">
                      <div class="w-full h-1.5 rounded-full bg-gradient-to-r from-blue-300 via-yellow-200 to-yellow-400"></div>
                    </div>
                    <div class="w-8 md:w-10 text-xs md:text-sm text-gray-900 text-right font-semibold">
                      {{ day.day?.maxtemp_c || 0 }}<span class="align-super text-xs">°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>