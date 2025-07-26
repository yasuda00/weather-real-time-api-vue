import './assets/main.css'
import { VueQueryPlugin } from '@tanstack/vue-query'
import Toast from "vue-toastification";
import 'vue-toastification/dist/index.css'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Set up TanStack Query
app.use(VueQueryPlugin)
app.use(Toast)
app.mount('#app')
