import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'         // 引入 Tailwind/基礎樣式
import { registerSW } from 'virtual:pwa-register'

// 自動更新 Service Worker 運作
registerSW({ immediate: true })

const app = createApp(App)
app.use(router)
app.mount('#app')