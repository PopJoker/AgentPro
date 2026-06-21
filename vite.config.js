import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/AgentPro/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/AgentPro/',
      scope: '/AgentPro/',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Agent Pro AI 場勘筆記',
        short_name: 'AI場勘筆記',
        description: '您的本地高效行動場勘物業管理工具',
        theme_color: '#1e293b',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: 'any',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'maskable' // 💡 保留這個，這樣在 Android 手機上圖標才不會被硬生生切醜
          }
        ]
      }
    })
  ],
})