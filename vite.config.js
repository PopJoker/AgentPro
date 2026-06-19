import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // 當 Service Worker 有更新時自動啟用
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // 需要快取的靜態資源
      manifest: {
        name: 'Agent Pro AI 場勘筆記',
        short_name: 'AI場勘筆記',
        description: '您的本地高效行動場勘物業管理工具',
        theme_color: '#1e293b', // 配合你的質感海軍藍/暗色調
        background_color: '#ffffff',
        display: 'standalone', // 讓 App 點開時隱藏瀏覽器網址列，像原生 App 一樣
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 確保在 Android 圓形圖示切割下不會破相
          }
        ]
      }
    })
  ],
  base: '/AgentPro/',
})