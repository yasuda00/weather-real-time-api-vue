<script setup>
import ListCity from './components/ListCity.vue';
import cloudImg from '@/assets/cloud.jpg';
import darkCloudImg from '@/assets/darkCloud.jpg';
import { ref, computed, onMounted } from 'vue';

// Determine if it's night time (between 6 PM and 6 AM)
const isNight = computed(() => {
  const hour = new Date().getHours();
  // TEMPORARY: Force night mode for testing - remove this line when done testing
  // return true; // This forces night mode
  return hour >= 18 || hour < 6; // 6 PM to 6 AM - uncomment this when done testing
});

// Select background image based on time
const backgroundImage = computed(() => {
  return isNight.value ? darkCloudImg : cloudImg;
});
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Dynamic cloud image background (top half) -->
    <div
      class="absolute inset-0 w-full h-1/2 bg-no-repeat bg-cover bg-top"
      :style="`background-image: url('${backgroundImage}'); z-index: 0;`"
    ></div>
    <!-- Gradient overlay for seamless transition -->
    <div class="absolute top-1/2 left-0 w-full h-24 pointer-events-none z-10"
         style="transform: translateY(-100%); background: linear-gradient(to bottom, rgba(249,250,251,0) 0%, #f9fafb 100%);">
    </div>
    <!-- White background (bottom half) -->
    <div class="absolute top-1/2 left-0 w-full h-1/2 bg-gray-50 z-0"></div>

    <!-- Main content (z-20 to be above backgrounds) -->
    <div class="relative z-20">
      <ListCity class="pt-40" />
    </div>
  </div>
</template>
