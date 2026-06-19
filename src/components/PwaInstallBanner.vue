<script setup>
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstallBtn = ref(false)
const isIos = ref(false)

onMounted(() => {
    // 1. 偵測是否為 iOS 裝置
    const ua = window.navigator.userAgent
    const isIpad = !!ua.match(/iPad/i)
    const isIphone = !!ua.match(/iPhone/i)

    if ((isIpad || isIphone) && !window.navigator.standalone) {
        isIos.value = true
        showInstallBtn.value = true
        return
    }

    // 2. Android 與電腦端瀏覽器的監聽
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt.value = e
        showInstallBtn.value = true
    })

    window.addEventListener('appinstalled', () => {
        showInstallBtn.value = false
        deferredPrompt.value = null
        console.log('PWA 安裝成功')
    })
})

const triggerInstall = async () => {
    if (isIos.value) {
        alert('iOS 安裝提示：\n\n請點擊 Safari 瀏覽器下方的「分享」按鈕，然後下滑選擇「加入主畫面」，即可完成安裝。')
        return
    }

    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`使用者選擇: ${outcome}`)
    showInstallBtn.value = false
    deferredPrompt.value = null
}
</script>

<template>
    <div v-if="showInstallBtn"
        class="w-full bg-[var(--code-bg)] border-b border-[var(--border)] transition-all duration-300">
        <div
            class="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="text-xs leading-normal">
                <span class="font-bold block font-mono uppercase tracking-wider text-[var(--text-h)]">OFFLINE CAPABLE /
                    支援離線安裝</span>
                <span v-if="isIos">將「Agent Pro」加入 iPhone 主畫面，場勘看房不受網路訊號限制。</span>
                <span v-else>將「Agent Pro」安裝至系統桌面，場勘看房不受網路訊號限制。</span>
            </div>
            <button @click="triggerInstall"
                class="action-btn text-xs font-semibold px-4 py-1.5 rounded font-mono shrink-0 self-start sm:self-center"
                style="background-color: var(--accent); color: #ffffff;">
                {{ isIos ? 'HOW TO INSTALL' : 'INSTALL APP' }}
            </button>
        </div>
    </div>
</template>