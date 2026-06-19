<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PwaInstallBanner from './components/PwaInstallBanner.vue'

const route = useRoute()
const isDark = ref(false)

// ─── 數據備份同步狀態 ───
const showSyncModal = ref(false)

onMounted(() => {
  // 主題載入邏輯
  const savedTheme = localStorage.getItem('agent-pro-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('agent-pro-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('agent-pro-theme', 'light')
  }
}

// ─── LocalStorage 導入 / 導出 / 清除邏輯 ───
const exportData = () => {
  try {
    const backup = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      backup[key] = localStorage.getItem(key)
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-pro-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('導出失敗：' + error.message)
  }
}

const importData = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result)
      if (confirm('導入將覆蓋現有數據，確定要繼續嗎？')) {
        localStorage.clear()
        Object.keys(backup).forEach(key => {
          localStorage.setItem(key, backup[key])
        })
        alert('數據導入成功，系統將自動重新載入。')
        window.location.reload()
      }
    } catch (error) {
      alert('解析備份檔案失敗，請確保格式正確。')
    }
  }
  reader.readAsText(file)
}

const clearAllData = () => {
  if (confirm('警告：這將永久刪除本地所有的場勘筆記與設定，且無法復原。確定清除嗎？')) {
    localStorage.clear()
    alert('本地數據已完全清除，系統將自動重新載入。')
    window.location.reload()
  }
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text)] transition-colors duration-300 pb-safe-bottom font-sans">

    <header
      class="w-full sticky top-0 z-50 bg-[var(--bg-nav)] backdrop-blur-md border-b border-[var(--border)] shadow-sm transition-all duration-300">
      <div class="max-w-7xl mx-auto h-16 md:h-20 px-4 md:px-8 flex items-center justify-between">

        <div class="flex items-center space-x-3 select-none">
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-white dark:text-[var(--highlight)] font-serif font-black text-base shadow-md shadow-blue-900/10 dark:shadow-none border dark:border-[var(--border)]">
            A
          </div>
          <div>
            <div class="text-sm font-bold tracking-tight text-[var(--text-h)] leading-none mb-0.5">Agent Pro</div>
            <div
              class="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wider uppercase scale-90 origin-left">
              Data Assistant</div>
          </div>
        </div>

        <nav class="hidden md:flex items-center h-full space-x-8">
          <router-link to="/"
            class="nav-item h-full flex items-center text-sm font-medium relative transition-colors duration-200"
            :class="route.path === '/' ? 'text-[var(--text-h)] font-semibold' : 'text-slate-400 dark:text-zinc-500 hover:text-[var(--text-h)]'">
            適合度計算
            <div
              class="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[var(--accent)] transition-transform duration-300 origin-center"
              :class="route.path === '/' ? 'scale-x-100' : 'scale-x-0'"></div>
          </router-link>

          <router-link to="/notes"
            class="nav-item h-full flex items-center text-sm font-medium relative transition-colors duration-200"
            :class="route.path.startsWith('/notes') ? 'text-[var(--text-h)] font-semibold' : 'text-slate-400 dark:text-zinc-500 hover:text-[var(--text-h)]'">
            場勘筆記
            <div
              class="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[var(--accent)] transition-transform duration-300 origin-center"
              :class="route.path.startsWith('/notes') ? 'scale-x-100' : 'scale-x-0'"></div>
          </router-link>

          <button @click="showSyncModal = !showSyncModal" class="text-sm font-medium transition-colors duration-200"
            :class="showSyncModal ? 'text-[var(--accent)] font-semibold' : 'text-slate-400 dark:text-zinc-500 hover:text-[var(--text-h)]'">
            數據同步
          </button>
        </nav>

        <div class="flex items-center space-x-4">
          <button @click="toggleTheme"
            class="relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none border bg-[var(--bg-app)] border-[var(--border)] hover:border-slate-300 dark:hover:border-zinc-600"
            aria-label="Toggle theme">
            <div
              class="w-4.5 h-4.5 rounded-full bg-[var(--bg)] shadow-md border border-[var(--border)] flex items-center justify-center transition-transform duration-300"
              :class="isDark ? 'translate-x-6' : 'translate-x-0'">
              <svg v-if="!isDark" class="w-3 h-3 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.243a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.757 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1abcM14 15.757a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM9 16.757a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-4-2.243a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM3.243 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm2.243-4a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <svg v-else class="w-2.5 h-2.5 text-[var(--highlight)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          </button>
        </div>

      </div>
    </header>

    <PwaInstallBanner />

    <div v-if="showSyncModal"
      class="w-full bg-[var(--bg)] border-b border-[var(--border)] transition-all duration-300 shadow-inner font-mono">
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div class="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-h)]">DATA BACKUP MANAGEMENT /
          本地數據備份管理</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <button @click="exportData"
            class="flex flex-col items-start p-3 text-left border border-[var(--border)] rounded-xl bg-[var(--bg-app)] hover:border-slate-400 dark:hover:border-zinc-500 transition-colors">
            <span class="text-xs font-bold text-[var(--text-h)]">EXPORT BACKUP</span>
            <span class="text-[11px] text-slate-400 mt-1">打包並下載目前裝置的全部場勘筆記至 JSON 檔案。</span>
          </button>

          <label
            class="flex flex-col items-start p-3 text-left border border-[var(--border)] rounded-xl bg-[var(--bg-app)] hover:border-slate-400 dark:hover:border-zinc-500 transition-colors cursor-pointer">
            <span class="text-xs font-bold text-[var(--text-h)]">IMPORT BACKUP</span>
            <span class="text-[11px] text-slate-400 mt-1">上傳備份檔案以覆蓋並還原此系統的資料庫。</span>
            <input type="file" accept=".json" @change="importData" class="hidden" />
          </label>

          <button @click="clearAllData"
            class="flex flex-col items-start p-3 text-left border border-red-200 dark:border-red-950/40 rounded-xl bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <span class="text-xs font-bold text-red-600 dark:text-red-400">PURGE STORAGE</span>
            <span class="text-[11px] text-red-400/80 mt-1">強制清空此台裝置儲存的快取資料並重設系統。</span>
          </button>
        </div>
      </div>
    </div>

    <main class="flex-grow w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-8 py-4 sm:py-8 pb-28 md:pb-12">
      <div
        class="w-full bg-[var(--bg)] border-y sm:border border-[var(--border)] sm:rounded-2xl p-4 sm:p-6 md:p-10 shadow-[var(--shadow)] transition-all duration-300">
        <router-view />
      </div>
    </main>

    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-nav)] backdrop-blur-md border-t border-[var(--border)] flex justify-around items-center px-4 pt-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
      <router-link to="/"
        class="flex flex-col items-center justify-center w-1/4 py-1 space-y-1 text-[11px] font-medium tracking-wide transition-all active:scale-95"
        :class="route.path === '/' && !showSyncModal ? 'text-[var(--accent)] font-semibold' : 'text-slate-400 dark:text-zinc-500'">
        <svg class="w-5 h-5 transition-transform" :class="route.path === '/' && !showSyncModal ? 'scale-110' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 002-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>適合度計算</span>
      </router-link>

      <router-link to="/notes"
        class="flex flex-col items-center justify-center w-1/4 py-1 space-y-1 text-[11px] font-medium tracking-wide transition-all active:scale-95"
        :class="route.path.startsWith('/notes') && !showSyncModal ? 'text-[var(--accent)] font-semibold' : 'text-slate-400 dark:text-zinc-500'">
        <svg class="w-5 h-5 transition-transform"
          :class="route.path.startsWith('/notes') && !showSyncModal ? 'scale-110' : ''" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>場勘筆記</span>
      </router-link>

      <button @click="showSyncModal = !showSyncModal"
        class="flex flex-col items-center justify-center w-1/4 py-1 space-y-1 text-[11px] font-medium tracking-wide transition-all active:scale-95"
        :class="showSyncModal ? 'text-[var(--accent)] font-semibold' : 'text-slate-400 dark:text-zinc-500'">
        <svg class="w-5 h-5 transition-transform" :class="showSyncModal ? 'scale-110' : ''" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>數據同步</span>
      </button>
    </nav>

  </div>
</template>

<style>
:root {
  /* ── 基礎文字與背景 ── */
  --bg: #ffffff;
  --bg-app: #f7f9fa;
  --bg-nav: rgba(255, 255, 255, 0.85);
  --text: #484848;
  --text-h: #222222;
  --border: #e4e4e4;
  --code-bg: #ffffff;

  /* ── 核心專業色 ── */
  --accent: #1e3a8a;
  --accent-bg: #eff6ff;
  --accent-border: #bfdbfe;
  --highlight: #b45309;
  --highlight-bg: #fffbeb;

  --shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

html.dark {
  --bg: #141414;
  --bg-app: #080808;
  --bg-nav: rgba(20, 20, 20, 0.8);
  --text: #a3a3a3;
  --text-h: #f5f5f5;
  --border: #262626;
  --code-bg: #141414;

  --accent: #60a5fa;
  --accent-bg: rgba(96, 165, 250, 0.05);
  --accent-border: rgba(96, 165, 250, 0.15);

  --highlight: #fbbf24;
  --highlight-bg: rgba(251, 191, 36, 0.05);
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

body {
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.01em;
  color: var(--text);
  background-color: var(--bg-app);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

a,
button {
  -webkit-tap-highlight-color: transparent;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>