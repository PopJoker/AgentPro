<script setup>
import { ref, onMounted } from 'vue'
import PwaInstallBanner from './components/PwaInstallBanner.vue'

const isDark = ref(false)

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
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text)] transition-colors duration-300 pb-safe-bottom font-sans">

    <header
      class="w-full sticky top-0 z-50 bg-[var(--bg-nav)] backdrop-blur-md border-b border-[var(--border)] shadow-sm transition-all duration-300">

      <div class="max-w-7xl mx-auto h-16 md:h-20 px-4 md:px-8 flex items-center justify-between gap-4">

        <router-link to="/" class="flex items-center space-x-3 select-none hover:opacity-90 transition shrink-0">
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-white dark:text-[var(--highlight)] font-serif font-black text-base shadow-md shadow-blue-900/10 dark:shadow-none border dark:border-[var(--border)]">
            A
          </div>
          <div>
            <div class="text-sm font-bold tracking-tight text-[var(--text-h)] leading-none mb-0.5">Agent Pro</div>
            <div
              class="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wider uppercase scale-90 origin-left">
              Housing Platform</div>
          </div>
        </router-link>

        <div class="flex items-center space-x-4 shrink-0 md:order-last">
          <button @click="toggleTheme"
            class="relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none border bg-[var(--bg-app)] border-[var(--border)] hover:border-slate-300 dark:hover:border-zinc-600"
            aria-label="Toggle theme">
            <div
              class="w-4.5 h-4.5 rounded-full bg-[var(--bg)] shadow-md border border-[var(--border)] flex items-center justify-center transition-transform duration-300"
              :class="isDark ? 'translate-x-6' : 'translate-x-0'">
              <svg v-if="!isDark" class="w-3 h-3 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.243a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.757 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1M14 15.757a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM9 16.757a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-4-2.243a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <svg v-else class="w-2.5 h-2.5 text-[var(--highlight)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          </button>
        </div>

        <nav class="hidden md:flex items-center space-x-1 h-full">
          <router-link to="/" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
              class="px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none whitespace-nowrap"
              :style="isActive ? 'background: var(--accent-bg); color: var(--accent);' : 'color: var(--text); opacity: 0.8;'">
              <span>找物件</span>
            </button>
          </router-link>

          <router-link to="/about" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
              class="px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none whitespace-nowrap"
              :style="isActive ? 'background: var(--accent-bg); color: var(--accent);' : 'color: var(--text); opacity: 0.8;'">
              <span>房仲詳情</span>
            </button>
          </router-link>
        </nav>

      </div>

      <nav
        class="flex md:hidden items-center justify-start gap-2 px-4 pb-3 pt-1 border-t border-[var(--border)] overflow-x-auto scrollbar-none">
        <router-link to="/" custom v-slot="{ navigate, isActive }">
          <button @click="navigate"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none whitespace-nowrap"
            :style="isActive ? 'background: var(--accent-bg); color: var(--accent);' : 'color: var(--text); opacity: 0.8;'">
            <span>找物件</span>
          </button>
        </router-link>

        <router-link to="/about" custom v-slot="{ navigate, isActive }">
          <button @click="navigate"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none whitespace-nowrap"
            :style="isActive ? 'background: var(--accent-bg); color: var(--accent);' : 'color: var(--text); opacity: 0.8;'">
            <span>房仲詳情</span>
          </button>
        </router-link>
      </nav>

    </header>

    <PwaInstallBanner />

    <main class="flex-grow w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-8 py-4 sm:py-8 pb-24 md:pb-12">
      <div
        class="w-full bg-[var(--bg)] border-y sm:border border-[var(--border)] sm:rounded-2xl p-4 sm:p-6 md:p-10 shadow-[var(--shadow)] transition-all duration-300">

        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

      </div>
    </main>

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

.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 💡 新增點：Fade 淡入淡出 CSS 動畫效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>