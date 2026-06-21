<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProperty } from '../composables/useProperty';

const route = useRoute();
const router = useRouter();

const {
    regions,
    properties,
    folderImages,
    regionsLoading,
    propertiesLoading,
    folderImagesLoading,
    error,
    fetchRegions,
    fetchPropertiesByRegion,
    fetchFolderImages
} = useProperty();

const selectedRegion = ref(null);
const searchQuery = ref('');
const isAllRegionsExpanded = ref(false);

// ---- 物件篩選狀態 ----
const propertySearchQuery = ref('');
const minBudget = ref(0);
const maxBudget = ref(0);

const debouncedMinBudget = ref(0);
const debouncedMaxBudget = ref(0);
let debounceTimer = null;

const isModalOpen = ref(false);
const activeProperty = ref(null);

// 行政區按鈕篩選
const filteredRegions = computed(() => {
    if (!regions.value) return [];
    if (!searchQuery.value.trim()) {
        return !isAllRegionsExpanded.value ? regions.value.slice(0, 5) : regions.value;
    }
    const query = searchQuery.value.trim().replace('區', '');
    return regions.value.filter(region => region.includes(query));
});

// 動態計算目前區域的租金範圍
const propertyPriceRange = computed(() => {
    if (!properties.value || properties.value.length === 0) return { min: 0, max: 0 };
    const prices = properties.value
        .map(p => parseInt(p['租金']))
        .filter(p => !isNaN(p));

    if (prices.length === 0) return { min: 0, max: 0 };
    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
});

// 監聽價格區間變化（解決切換區段時的預算防抖 Bug）
watch(propertyPriceRange, (newRange) => {
    minBudget.value = newRange.min;
    maxBudget.value = newRange.max;
    debouncedMinBudget.value = newRange.min;
    debouncedMaxBudget.value = newRange.max;
});

// 核心功能：當物件列表載入完成後，檢查 URL 是否帶有特定物件 ID 並自動點開
watch(properties, (newProps) => {
    propertySearchQuery.value = '';

    if (newProps && newProps.length > 0) {
        const targetId = route.query.id;
        if (targetId) {
            // 尋找符合 唯一ID (地址-房號) 的物件
            const matchedItem = newProps.find(item => {
                const itemId = item['地址'] + '-' + (item['房號'] || '');
                return itemId === targetId;
            });

            if (matchedItem) {
                openPropertyModal(matchedItem);
            }
        }
    }
}, { deep: true });

// 滑桿防撞 Bug ＆ 防抖處理
const triggerDebounceFilter = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debouncedMinBudget.value = minBudget.value;
        debouncedMaxBudget.value = maxBudget.value;
    }, 80);
};

const handleMinBudgetInput = () => {
    if (minBudget.value > maxBudget.value) {
        minBudget.value = maxBudget.value;
    }
    triggerDebounceFilter();
};

const handleMaxBudgetInput = () => {
    if (maxBudget.value < minBudget.value) {
        maxBudget.value = minBudget.value;
    }
    triggerDebounceFilter();
};

// ---- 最終渲染篩選 ----
const filteredProperties = computed(() => {
    if (!properties.value) return [];
    const keyword = propertySearchQuery.value.trim().toLowerCase();

    return properties.value.filter(item => {
        const matchTitle = item[item['區域']] || item['地址'] || '';
        const matchNote = item['備註'] || '';
        const matchesKeyword = !keyword ||
            matchTitle.toLowerCase().includes(keyword) ||
            matchNote.toLowerCase().includes(keyword);

        const rent = parseInt(item['租金']);
        let matchesBudget = true;
        if (!isNaN(rent)) {
            matchesBudget = rent >= debouncedMinBudget.value && rent <= debouncedMaxBudget.value;
        }

        return matchesKeyword && matchesBudget;
    });
});

// 切換區域：保留或重置 URL 參數
const handleRegionChange = (region) => {
    selectedRegion.value = region;
    // 切換新區域時，主動拿掉舊的物件 id
    router.push({ path: '/', query: { region: region } });
};

// 打開彈窗：同時將該物件的唯一 ID 寫入網址，方便使用者直複製網址分享
const openPropertyModal = async (item) => {
    activeProperty.value = item;
    isModalOpen.value = true;

    const itemId = item['地址'] + '-' + (item['房號'] || '');
    // 保持目前的 region，並追加 id 參數至網址
    router.replace({
        path: '/',
        query: { ...route.query, region: selectedRegion.value, id: itemId }
    });

    await fetchFolderImages(item['資料夾網址']);
};

// 關閉彈窗：把網址上的 id 參數拿掉，還原成乾淨的區域網址
// 關閉彈窗：把網址上的 id 參數拿掉，還原成乾淨的區域網址
const closePropertyModal = () => {
    isModalOpen.value = false;
    activeProperty.value = null;
    isCopied.value = false; // ✨ 直接在這裡重置複製狀態，最安全、不報錯

    const newQuery = { ...route.query };
    delete newQuery.id; // 移除 id
    router.replace({ path: '/', query: newQuery });
};

// 監聽網址 Region 的變化來抓取資料
watch(
    () => route.query.region,
    async (newRegion) => {
        if (newRegion) {
            selectedRegion.value = newRegion;
            const cleanRegion = newRegion.endsWith('區') ? newRegion : `${newRegion}區`;
            document.title = `${cleanRegion}物件 | 陳大哥精選代管`;
            fetchPropertiesByRegion(newRegion);
        } else {
            selectedRegion.value = null;
            document.title = '陳大哥精選代管物件 | Agent Pro';
        }
    },
    { immediate: true }
);

// ---- 特色標籤折疊狀態控制 ----
const expandedTags = ref(new Set());
const toggleTags = (itemKey) => {
    if (expandedTags.value.has(itemKey)) {
        expandedTags.value.delete(itemKey);
    } else {
        expandedTags.value.add(itemKey);
    }
    expandedTags.value = new Set(expandedTags.value);
};

const isCopied = ref(false);

const copyShareLink = async () => {
    try {
        const currentUrl = window.location.href;

        // 優先使用現代瀏覽器 API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(currentUrl);
        } else {
            // 降級相容方案：解決部分手機 Line 內建瀏覽器不支援 clipboard API 的問題
            const textarea = document.createElement('textarea');
            textarea.value = currentUrl;
            textarea.style.position = 'fixed';  // 避免螢幕滾動
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        isCopied.value = true;
        setTimeout(() => {
            isCopied.value = false;
        }, 2000);
    } catch (err) {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動複製瀏覽器網址。');
    }
};


const retryFetch = () => {
    if (!selectedRegion.value) {
        fetchRegions();
    } else {
        fetchPropertiesByRegion(selectedRegion.value);
    }
};

onMounted(async () => {
    await fetchRegions();
    if (route.query.region) {
        selectedRegion.value = route.query.region;
    }
});
</script>

<template>
    <div class="property-container max-w-7xl mx-auto p-4 md:p-6 min-h-screen"
        style="background: var(--bg-app); color: var(--text);">

        <header class="mb-6 border-b pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4"
            style="border-color: var(--border);">
            <div>
                <h1 class="text-3xl font-extrabold tracking-tight" style="color: var(--text-h);">小陳精選代管物件</h1>
                <p class="mt-1 text-sm opacity-80">免登入、請先選擇欲查看的區域</p>
            </div>

            <div v-if="selectedRegion && !propertiesLoading && !error"
                class="text-sm border px-4 py-2 rounded-xl shadow-sm self-start"
                style="background: var(--bg); border-color: var(--border); color: var(--text);">
                {{ selectedRegion.endsWith('區') ? selectedRegion : selectedRegion + '區' }}共有 <span class="font-bold"
                    style="color: var(--accent);">{{ properties.length }}</span> 個優質物件
            </div>
        </header>

        <div class="mb-6 p-4 rounded-2xl border bg-[var(--bg)] transition-all" style="border-color: var(--border);">
            <div class="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <div class="relative flex-1">
                    <input v-model="searchQuery" type="text" placeholder="搜尋台中行政區 (例如: 西屯、北區)"
                        class="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition"
                        style="background: var(--bg-app); border-color: var(--border); color: var(--text); --tw-ring-color: var(--accent);" />
                </div>
                <button v-if="!searchQuery && (regions?.length > 5)"
                    @click="isAllRegionsExpanded = !isAllRegionsExpanded"
                    class="px-4 py-2.5 rounded-xl text-xs font-bold border transition self-start md:self-auto"
                    style="background: var(--bg-app); border-color: var(--border); color: var(--text);">
                    {{ isAllRegionsExpanded ? '收合部分區域' : '顯示全部區域' }}
                </button>
            </div>

            <div v-if="regionsLoading" class="py-2 text-center text-sm opacity-60">
                正在載入區域選單...
            </div>

            <transition-group v-else name="list" tag="div" class="flex flex-wrap gap-2 relative min-h-[40px]">

                <!-- 關鍵：用一小層 div 當作動畫容器，並把 key 綁在這裡，繼承 flex 特性 -->
                <div v-for="region in filteredRegions" :key="region" class="relative inline-block">
                    <button @click="handleRegionChange(region)" :style="selectedRegion === region
                        ? 'background: var(--accent); color: #ffffff; border-color: var(--accent);'
                        : 'background: var(--bg-app); color: var(--text); border-color: var(--border);'"
                        class="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition border shadow-sm whitespace-nowrap hover:border-slate-400 dark:hover:border-zinc-500">
                        {{ region.endsWith('區') ? region : region + '區' }}
                    </button>
                </div>

                <!-- 提示無結果的文字 -->
                <p v-if="filteredRegions.length === 0" :key="'no-result'" class="text-sm opacity-50 py-1 pl-1 w-full">
                    找不到與「{{ searchQuery }}」符合的行政區
                </p>
            </transition-group>
        </div>

        <div v-if="error" class="text-center py-16 border rounded-2xl shadow-sm max-w-md mx-auto p-6"
            style="background: var(--bg); border-color: var(--border);">
            <p class="font-semibold mb-2" style="color: var(--text-h);">同步屋況失敗</p>
            <p class="text-sm mb-4 opacity-60">{{ error }}</p>
            <button @click="retryFetch" class="px-4 py-2 text-white rounded-xl text-sm font-medium transition"
                style="background: var(--accent);">
                重新嘗試
            </button>
        </div>

        <div v-else-if="!selectedRegion" class="text-center py-32 border rounded-2xl border-dashed"
            style="border-color: var(--border);">
            <p class="opacity-60 text-lg">請選取上方行政區，或使用搜尋功能查找最新空房</p>
        </div>

        <div v-else-if="propertiesLoading" class="text-center py-24">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style="border-color: var(--accent);"></div>
            <p class="font-medium opacity-80">正在即時同步 {{ selectedRegion.endsWith('區') ? selectedRegion : selectedRegion +
                '區' }} 最新屋況與照片...</p>
        </div>

        <div v-else-if="properties.length > 0"
            class="mb-6 p-4 rounded-2xl border bg-[var(--bg)] flex flex-col md:flex-row gap-6 items-center"
            style="border-color: var(--border);">
            <div class="w-full md:w-1/2 relative">
                <label class="block text-xs font-bold mb-1.5 opacity-70">搜尋此區域的特定社區、地址或備註</label>
                <input v-model="propertySearchQuery" type="text" placeholder="輸入名稱或關鍵字..."
                    class="w-full px-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition"
                    style="background: var(--bg-app); border-color: var(--border); color: var(--text); --tw-ring-color: var(--accent);" />
            </div>

            <div class="w-full md:w-1/2">
                <div class="flex justify-between items-center mb-1.5">
                    <label class="text-xs font-bold opacity-70">租金預算範圍</label>
                    <span class="text-sm font-extrabold text-[var(--highlight)]">
                        ${{ minBudget.toLocaleString() }} ~ ${{ maxBudget.toLocaleString() }} / 月
                    </span>
                </div>
                <div class="flex items-center gap-3 relative pt-2">
                    <span class="text-xs opacity-50">${{ propertyPriceRange.min.toLocaleString() }}</span>

                    <div class="relative flex-1 h-2 flex items-center">
                        <input type="range" :min="propertyPriceRange.min" :max="propertyPriceRange.max" step="500"
                            v-model.number="minBudget" @input="handleMinBudgetInput"
                            class="absolute w-full h-1 appearance-none pointer-events-none bg-transparent accent-[var(--highlight)] z-20"
                            style="letter-spacing: normal;" />

                        <input type="range" :min="propertyPriceRange.min" :max="propertyPriceRange.max" step="500"
                            v-model.number="maxBudget" @input="handleMaxBudgetInput"
                            class="absolute w-full h-1 appearance-none pointer-events-none bg-transparent accent-[var(--highlight)] z-20" />

                        <div class="absolute inset-x-0 h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg z-10"></div>
                    </div>

                    <span class="text-xs opacity-50">${{ propertyPriceRange.max.toLocaleString() }}</span>
                </div>
            </div>
        </div>

        <div v-if="selectedRegion && !propertiesLoading && !error">
            <!-- 修正點：將原本的普通的 grid 替換為 transition-group，並指定 tag="div" -->
            <transition-group v-if="filteredProperties.length > 0" name="grid-list" tag="div"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">

                <!-- 關鍵：用一殼層 div 綁定唯一 key，並鎖定 position: relative 提供 absolute 定錨 -->
                <div v-for="item in filteredProperties" :key="item['地址'] + '-' + (item['房號'] || '')"
                    class="relative transition-all duration-300">

                    <!-- 內部卡片結構保持不變 -->
                    <div class="border rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md h-full"
                        style="background: var(--bg); border-color: var(--border);">

                        <div @click="openPropertyModal(item)"
                            class="block relative overflow-hidden group cursor-pointer">
                            <img :src="item['照片網址']" alt="房屋照片"
                                class="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />

                            <span
                                class="absolute bottom-2 left-2 text-[11px] px-2 py-0.5 rounded flex items-center backdrop-blur-sm text-white bg-black/70">
                                點擊查看房間詳情
                            </span>

                            <span
                                :style="(!item['現況'] || item['現況'].includes('空')) ? 'background: #22c55e;' : 'background: var(--highlight);'"
                                class="absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                                {{ item['現況'] || '空房中' }}
                            </span>
                        </div>

                        <div class="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <div class="flex gap-2 items-center mb-2">
                                    <span class="text-xs font-bold px-2 py-0.5 rounded border"
                                        style="background: var(--accent-bg); color: var(--accent); border-color: var(--accent-border);">
                                        台中市{{ item['區域'].endsWith('區') ? item['區域'] : item['區域'] + '區' }}
                                    </span>
                                    <span v-if="item['房號']" class="text-xs font-bold px-2 py-0.5 rounded border"
                                        style="background: var(--highlight-bg); color: var(--highlight); border-color: var(--border);">
                                        房號: {{ item['房號'] }}
                                    </span>
                                </div>

                                <h3 @click="openPropertyModal(item)"
                                    class="font-extrabold text-xl mb-2 line-clamp-1 cursor-pointer hover:opacity-80 transition"
                                    :style="`color: var(--text-h);`" :title="item[item['區域']] || item['地址']">
                                    {{ item[item['區域']] || item['地址'] || '精選優質代管物件' }}
                                </h3>

                                <!-- 修正後：超過 3 個 Tag 自動折疊，點擊可切換展開/收合 -->
                                <div v-if="item['特色標籤'] && item['特色標籤'].length > 0"
                                    class="flex flex-wrap gap-1.5 mb-2 mt-1 items-center">

                                    <!-- 根據展開狀態決定渲染前 3 個還是全部 -->
                                    <span
                                        v-for="tag in (expandedTags.has(item['地址'] + '-' + (item['房號'] || '')) ? item['特色標籤'] : item['特色標籤'].slice(0, 3))"
                                        :key="tag"
                                        class="px-2 py-0.5 rounded-lg text-xs font-semibold border transition duration-200 shadow-sm"
                                        style="background: rgba(14, 165, 233, 0.06); color: #0ea5e9; border-color: rgba(14, 165, 233, 0.2);">
                                        # {{ tag }}
                                    </span>

                                    <!-- 當 Tag 數量大於 3 時，顯示控制按鈕 -->
                                    <button v-if="item['特色標籤'].length > 3"
                                        @click.stop="toggleTags(item['地址'] + '-' + (item['房號'] || ''))"
                                        class="px-2 py-0.5 rounded-lg text-xs font-bold border border-dashed transition duration-200 hover:opacity-80 active:scale-95"
                                        style="background: var(--bg-app); color: var(--text); border-color: var(--border);">
                                        {{ expandedTags.has(item['地址'] + '-' + (item['房號'] || '')) ? '收合' :
                                            `+${item['特色標籤'].length - 3} 更多...` }}
                                    </button>
                                </div>

                                <div class="p-2.5 rounded-xl mb-4 mt-3 border"
                                    style="background: var(--bg-app); border-color: var(--border);">
                                    <p class="text-sm leading-relaxed">
                                        <span class="font-bold" style="color: var(--text-h);">配置/備註：</span>
                                        <span class="block mt-1 text-xs whitespace-pre-line opacity-80">
                                            {{ item['備註'] || '尚無詳細備註說明' }}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div class="border-t pt-4 mt-auto" style="border-color: var(--border);">
                                <div class="flex justify-between items-baseline mb-4">
                                    <span class="text-xs opacity-60">即時同步物件</span>
                                    <span class="text-2xl font-black" style="color: var(--highlight);">
                                        ${{ item['租金'] || '面議' }} <span class="text-xs font-normal opacity-60">/
                                            月</span>
                                    </span>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                    <button @click="openPropertyModal(item)"
                                        class="text-center font-bold py-2.5 rounded-xl transition duration-200 shadow-sm text-sm border"
                                        style="background: var(--bg); color: var(--text); border-color: var(--border);">
                                        查看完整照片
                                    </button>
                                    <a href="https://line.me/ti/p/438AejZ8vj" target="_blank"
                                        class="block text-center font-bold py-2.5 rounded-xl transition duration-200 shadow-sm text-sm text-white"
                                        style="background: #06C755;">
                                        加 LINE 聯絡小陳
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition-group>

            <div v-else class="text-center py-24 border rounded-2xl shadow-sm"
                style="background: var(--bg); border-color: var(--border);">
                <p class="opacity-60">沒有符合您當前關鍵字或預算條件的空房，請調整篩選條件！</p>
            </div>
        </div>
        <Transition name="modal">
            <div v-if="isModalOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                @click.self="closePropertyModal">

                <div class="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border animate-in fade-in zoom-in-95 duration-200"
                    style="background: var(--bg); border-color: var(--border); color: var(--text);">

                    <div class="p-4 md:p-5 border-b flex justify-between items-start"
                        style="border-color: var(--border);">
                        <div>
                            <div class="flex gap-2 items-center mb-1">
                                <span class="text-xs font-bold px-2 py-0.5 rounded border"
                                    style="background: var(--accent-bg); color: var(--accent); border-color: var(--accent-border);">
                                    台中市{{ activeProperty?.['區域'] }}
                                </span>
                                <span v-if="activeProperty?.['房號']" class="text-xs font-bold px-2 py-0.5 rounded border"
                                    style="background: var(--highlight-bg); color: var(--highlight); border-color: var(--border);">
                                    房號: {{ activeProperty?.['房號'] }}
                                </span>
                                <span class="text-xs font-bold px-2 py-0.5 rounded text-white"
                                    :style="(!activeProperty?.['現況'] || activeProperty?.['現況'].includes('空')) ? 'background: #22c55e;' : 'background: var(--highlight);'">
                                    {{ activeProperty?.['現況'] || '空房中' }}
                                </span>
                            </div>
                            <h2 class="text-xl md:text-2xl font-black" style="color: var(--text-h);">
                                {{ activeProperty?.[activeProperty?.['區域']] || activeProperty?.['地址'] }}
                            </h2>
                        </div>
                        <button @click="closePropertyModal"
                            class="p-2 rounded-xl hover:bg-black/5 transition text-sm font-bold opacity-70 hover:opacity-100">關閉</button>
                    </div>

                    <div class="p-5 overflow-y-auto flex-1 space-y-5">
                        <div>
                            <h3 class="text-sm font-bold mb-3 flex items-center gap-2" style="color: var(--text-h);">
                                <span>內部實況相簿</span>
                                <span v-if="!folderImagesLoading" class="text-xs font-normal opacity-60">(共 {{
                                    folderImages.length }} 張)</span>
                            </h3>

                            <div v-if="folderImagesLoading"
                                class="py-16 text-center space-y-3 border border-dashed rounded-xl"
                                style="border-color: var(--border);">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                                    style="border-color: var(--accent);"></div>
                                <p class="text-xs opacity-70">正在安全地連線至雲端硬碟下載照片串流...</p>
                            </div>

                            <div v-else-if="folderImages.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div v-for="(imgSrc, idx) in folderImages" :key="idx"
                                    class="relative group aspect-[4/3] rounded-xl overflow-hidden border bg-black/5"
                                    style="border-color: var(--border);">
                                    <img :src="imgSrc" alt="房間細節圖"
                                        class="w-full h-full object-cover transition duration-300 hover:scale-105"
                                        loading="lazy" />
                                </div>
                            </div>

                            <div v-else class="py-12 text-center border border-dashed rounded-xl opacity-60 text-sm"
                                style="border-color: var(--border);">
                                此物件雲端資料夾內目前暫無相片檔案
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4"
                            style="border-color: var(--border);">
                            <div class="md:col-span-2 space-y-3">
                                <div class="p-3 rounded-xl border"
                                    style="background: var(--bg-app); border-color: var(--border);">
                                    <span class="text-xs font-bold block mb-1 opacity-70">配置與備註細節</span>
                                    <p class="text-sm whitespace-pre-line leading-relaxed opacity-90">{{
                                        activeProperty?.['備註'] || '無詳細說明' }}</p>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div class="p-3 rounded-xl border text-center"
                                    style="background: var(--highlight-bg); border-color: var(--border);">
                                    <span class="text-xs font-bold block opacity-70 mb-1">每月租金</span>
                                    <span class="text-2xl font-black" style="color: var(--highlight);">${{
                                        activeProperty?.['租金'] }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 border-t flex flex-col sm:flex-row gap-2 sm:justify-end"
                        style="border-color: var(--border); background: var(--bg-app);">

                        <!-- 新增：複製網址按鈕 -->
                        <button @click="copyShareLink"
                            class="px-5 py-2 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1.5"
                            :style="isCopied
                                ? 'background: #22c55e; color: #ffffff; border-color: #22c55e;'
                                : 'background: var(--bg); color: var(--text); border-color: var(--border);'">
                            <!-- 動態切換 SVG 圖標 -->
                            <svg v-if="isCopied" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            {{ isCopied ? '已複製連結！' : '複製物件連結' }}
                        </button>

                        <button @click="closePropertyModal"
                            class="px-5 py-2 rounded-xl text-sm font-semibold border bg-white text-gray-700 hover:bg-gray-50 transition"
                            style="border-color: var(--border);">
                            關閉視窗
                        </button>

                        <a href="https://line.me/ti/p/438AejZ8vj" target="_blank"
                            class="px-5 py-2 rounded-xl text-sm font-bold text-center text-white transition"
                            style="background: #06C755;">
                            立即加 LINE 預約看房 (小陳)
                        </a>
                    </div>

                </div>
            </div>
        </Transition>

    </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
    pointer-events: auto;
}

input[type="range"]::-moz-range-thumb {
    pointer-events: auto;
}

/* 💡 新增點：行政區按鈕列表的 Transition Group 動畫效果 */

/* ==========================================================================
   ✨ 終極修正版：行政區按鈕轉場動畫
   ========================================================================== */

/* 1. 進入與離開的持續狀態 */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 2. 離開進行中：強制讓外層 wrapper 留在原本的物理位子上，並漸隱 */
.list-leave-active {
    position: absolute !important;
    /* 核心修正：利用 w-max 鎖定內容寬度，加上 pointer-events-none 防止離場時被誤點 */
    width: max-content;
    pointer-events: none;
}

/* 3. 進入起點 & 離開終點 */
.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: scale(0.85) translateY(4px);
    /* 帶有一點點往下沉的淡出感 */
}

/* 4. 其餘按鈕的平滑滑動（這時候因為有 wrapper 錨點，會非常絲滑） */
.list-move {
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 1. 進入與離開時的過渡平滑度 */
.grid-list-enter-active,
.grid-list-leave-active {
    transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 2. 離開進行中：讓卡片脫離文檔流，避免卡住補位動畫 */
.grid-list-leave-active {
    position: absolute !important;
    pointer-events: none;

    /* 核心精準度：配合 Tailwind 的 gap-6 (24px)，確保離場時維持 Grid 的大略物理寬度，防止卡片縮小變形 */
    width: 100%;
}

/* 因應響應式 RWD 斷點，離場的 absolute 元件需要與外層 Grid 的寬度對齊 */
@media (min-width: 768px) {
    .grid-list-leave-active {
        width: calc((100% - 24px) / 2);
    }
}

@media (min-width: 1024px) {
    .grid-list-leave-active {
        width: calc((100% - 48px) / 3);
    }
}

/* 3. 進入起點與離開終點：加入輕微的縮放與淡出 */
.grid-list-enter-from,
.grid-list-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
}

/* 4. 留下來的卡片移動時的平滑補位效果 */
.grid-list-move {
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 針對內層的卡片做額外的縮放轉場，讓視覺更靈活 */
.modal-enter-active>div,
.modal-leave-active>div {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    /* 帶有一點點微彈性的貝茲曲線 */
}

/* 進入起點 與 離開終點 狀態 */
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* 進入起點 與 離開終點 時，讓內層卡片縮小 95% 並微微下沉 */
.modal-enter-from>div,
.modal-leave-to>div {
    transform: scale(0.95) translateY(8px);
}
</style>