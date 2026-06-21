<script setup>
import { ref } from 'vue'

const agentInfo = ref({
    name: '小陳 ',
    title: 'Lever 24 房仲',
    brand: '超級強房仲',
    lineUrl: 'https://line.me/ti/p/438AejZ8vj',
    qrCodePath: './IMG_7765.jpg',
    experience: '專業經營大桃園、中壢及周邊區域物業管理',
    bio: '我們專注於提供高品質、現代化的優質套房與住宅代管服務。每一個物件都經過我們嚴格篩選、風格裝潢，並提供一條龍的租後物業維護，讓房東放心收租、房客安心入住。',
    stats: [
        { label: '在管物件', value: '150+' },
        { label: '平均出租天數', value: '7 天' },
        { label: '房客滿意度', value: '98%' },
    ],
    services: [
        { title: '精選物件陪同帶看', desc: '親自帶您實地看房，詳細解說周邊生活機能、採光通訊與房屋現況，解答您所有的租房疑問。' },
        { title: '租賃合約協助簽署', desc: '協助房東與房客溝通合約細節，確保租賃合約內容權益公允、條款清晰，保障雙方權益。' },
        { title: '現場點交設備驗收', desc: '交屋時現場核對水電度數、清點家具設備現況並交付鑰匙，確保入住當天一切順利。' }
    ]
})

const isDevModalOpen = ref(false);

const openBlog = () => {
    window.open('https://popjoker.github.io/pop-blog/', '_blank');
};
</script>

<template>
    <!-- 確保只有一個乾淨的單一根節點 -->
    <div class="max-w-4xl mx-auto py-2 px-1">

        <div class="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-[var(--border)]">
            <div
                class="w-32 h-32 rounded-3xl bg-[var(--bg)] shadow-lg border border-[var(--border)] shrink-0 select-none overflow-hidden flex items-center justify-center p-4 transition-all duration-300 hover:shadow-xl">
                <img src="/HEIF.jpg" alt="Agent Pro 標誌" class="w-full h-full object-contain" loading="lazy" />
            </div>

            <div class="flex-grow text-center md:text-left">
                <span
                    class="inline-block px-3 py-1 text-xs font-extrabold rounded-full bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)] mb-3">
                    {{ agentInfo.brand }}
                </span>
                <h1 @click="isDevModalOpen = true"
                    class="text-3xl font-black text-[var(--text-h)] tracking-tight mb-1 cursor-pointer hover:opacity-80 transition duration-200">
                    {{ agentInfo.name }}
                </h1>
                <p class="text-sm font-semibold text-slate-400 dark:text-zinc-500 mb-4 tracking-wide">
                    {{ agentInfo.title }}
                </p>
                <p class="text-[15px] leading-relaxed text-[var(--text)] max-w-2xl font-normal">
                    {{ agentInfo.bio }}
                </p>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4 my-8">
            <div v-for="(stat, idx) in agentInfo.stats" :key="idx"
                class="bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 text-center transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700">
                <div class="text-2xl md:text-3xl font-black text-[var(--accent)] mb-1">{{ stat.value }}</div>
                <div class="text-xs md:text-sm font-bold text-slate-400 dark:text-zinc-500 tracking-wide">
                    {{ stat.label }}
                </div>
            </div>
        </div>

        <div class="my-10">
            <h2 class="text-xl font-extrabold text-[var(--text-h)] mb-6 flex items-center gap-2">
                <span class="w-1.5 h-5 rounded-full bg-[var(--accent)] inline-block"></span>
                我們的專業服務
            </h2>
            <div class="grid flex-col md:grid-cols-3 gap-6">
                <div v-for="(service, idx) in agentInfo.services" :key="idx"
                    class="p-5 border border-[var(--border)] rounded-2xl bg-[var(--bg)] shadow-sm transition-all duration-300 hover:shadow-md">
                    <h3 class="text-base font-bold text-[var(--text-h)] mb-2 text-[var(--highlight)]">
                        {{ service.title }}
                    </h3>
                    <p class="text-sm leading-relaxed text-[var(--text)] opacity-90">{{ service.desc }}</p>
                </div>
            </div>
        </div>

        <div class="mt-10 p-6 md:p-8 bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-2xl">
            <h2 class="text-lg font-black text-[var(--text-h)] mb-2">想預約看房？</h2>
            <p class="text-sm text-[var(--text)] opacity-80 mb-6">歡迎透過 LINE Directly 與我聯絡，電腦版用戶可直接跨頁掃描條碼加好友！</p>

            <div class="flex flex-col md:flex-row items-stretch gap-6">
                <div class="flex-1 w-full flex">
                    <a :href="agentInfo.lineUrl" target="_blank" rel="noopener noreferrer"
                        class="w-full h-full flex flex-row items-center justify-center gap-3 px-6 py-5 md:py-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all text-base select-none">
                        <svg class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M24 10.272c0-5.674-5.384-10.272-12-10.272S0 4.598 0 10.272c0 5.08 4.29 9.324 10.116 10.158.394.084.93.26 1.064.598.122.31.08.796.04 1.112l-.17 1.026c-.05.304-.244 1.19.106 1.626.346.43 1.162.294 1.622.024l6.14-3.606c1.844-1.054 3.196-2.522 4.166-4.24 1.178-2.078 1.916-4.394 1.916-6.44z" />
                        </svg>
                        <span class="text-lg tracking-wider">加 LINE 線上諮詢</span>
                    </a>
                </div>

                <div
                    class="flex flex-col items-center justify-center bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] shadow-sm shrink-0">
                    <img :src="agentInfo.qrCodePath" alt="LINE QR Code"
                        class="w-28 h-28 md:w-32 md:h-32 object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                        loading="lazy" />
                    <span
                        class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-2 tracking-wide select-none">LINE
                        掃描加好友</span>
                </div>
            </div>

            <div @click="isDevModalOpen = true"
                class="mt-6 text-center md:text-left border-t border-[var(--accent-border)] pt-4 opacity-70 cursor-pointer hover:opacity-100 transition group">
                <span
                    class="text-xs text-slate-500 dark:text-zinc-400 font-medium block sm:inline group-hover:text-[var(--accent)] transition">
                    網頁開發人員：杜先生 / 網頁開發者信箱：mavericktu0@gmail.com <span class="underline">（點擊查看開發者資訊）</span>
                </span>
            </div>
        </div>

        <!-- 修正點 1：將彈窗改放至根結點內部，避免 Vue 3 動態節點對應失敗 -->
        <Transition name="modal">
            <div v-if="isDevModalOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                @click.self="isDevModalOpen = false">

                <!-- 修正點 2：加入專屬的類名 modal-content 用於動畫精確控制，阻斷 scoped 限制 -->
                <div class="modal-content w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden border"
                    style="background: var(--bg); border-color: var(--border); color: var(--text);">

                    <div class="p-5 border-b flex justify-between items-center" style="border-color: var(--border);">
                        <h2 class="text-lg font-black tracking-tight" style="color: var(--text-h);">關於網頁開發者</h2>
                        <button @click="isDevModalOpen = false"
                            class="text-sm font-bold opacity-60 hover:opacity-100 px-2 py-1 rounded-lg hover:bg-black/5 transition">關閉</button>
                    </div>

                    <div class="p-6 space-y-5 overflow-y-auto">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shrink-0 p-1.5 dark:bg-gradient-to-tr dark:from-slate-800 dark:to-indigo-950 dark:border-slate-700/50 dark:shadow-indigo-950/40">
                                <img src="/logo.svg" alt="Developer Logo"
                                    class="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" />
                            </div>
                            <div>
                                <h3 class="text-base font-extrabold" style="color: var(--text-h);">杜品延 (Maverick Tu)
                                </h3>
                                <p class="text-xs opacity-60 mt-0.5">Full Stack Developer</p>
                            </div>
                        </div>

                        <p class="text-sm leading-relaxed opacity-90">
                            哈囉！我是此系統的開發者。本系統採用現代化技術打造，專為物業管理與精選代管物件提供流暢、即時的高效租屋體驗。
                        </p>

                        <button @click="openBlog"
                            class="w-full py-3 px-4 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2">
                            <span>瀏覽開發者部落格</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>

                        <div class="p-4 rounded-xl border text-xs space-y-1.5 leading-relaxed"
                            style="background: var(--bg-app); border-color: var(--border);">
                            <div class="font-bold flex items-center gap-1.5" style="color: var(--text-h);">
                                <span>MIT License</span>
                            </div>
                            <p class="opacity-60">Copyright (c) 2026 Maverick Tu</p>
                            <p class="opacity-70 border-t pt-1.5 mt-1.5" style="border-color: var(--border);">
                                本軟體基於 MIT 條款自由授權。任何人皆可免費使用、修改或整合本專案，唯須在軟體複本中包含上述版權聲明。
                            </p>
                        </div>
                    </div>

                    <div class="p-4 border-t flex justify-end"
                        style="border-color: var(--border); background: var(--bg-app);">
                        <button @click="isDevModalOpen = false"
                            class="px-4 py-2 border rounded-xl text-xs font-bold bg-[var(--bg)] hover:bg-black/5 transition"
                            style="border-color: var(--border);">
                            知道了
                        </button>
                    </div>

                </div>
            </div>
        </Transition>

    </div>
</template>

<style scoped>
/* 修正點 3：改寫 CSS 選擇器，顯式控制外層與內層的轉場效果，確保 scoped 正常解析 */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s linear;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
    transform: scale(0.95) translateY(8px);
}
</style>