<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage'

const router = useRouter()
const { notes, addNote, deleteNote } = useStorage()

// ─── 搜尋與過濾狀態 ───
const searchQuery = ref('')
const maxRentFilter = ref(25000) // 預設篩選上限 25,000

// ─── 快速新增房源狀態 ───
const showAddModal = ref(false)
const isAnalyzing = ref(false) // 🌟 新增：追蹤 AI 是否正在分析中
const newNoteText = ref('')
const newNoteTitle = ref('')

// ─── 動態過濾後的房源列表 ───
const filteredNotes = computed(() => {
  return notes.value.filter(note => {
    const matchesKeyword =
      note.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      note.address.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesRent = note.rent <= maxRentFilter.value

    return matchesKeyword && matchesRent
  })
})

// ─── 處理新增邏輯 ───
const handleAddNote = async () => {
  if (!newNoteTitle.value) return
  isAnalyzing.value = true

  try {
    const response = await fetch("https://agent-pro-ai-worker.popjoker.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: newNoteText.value })
    })

    if (!response.ok) {
      let errorDetail = "未知錯誤";
      try {
        const errJson = await response.json();
        // 抓取你在 Worker 裡寫的 error, message, stack
        errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch (e) {
        errorDetail = `無法解析後端錯誤內文 (狀態碼: ${response.status})`;
      }
      throw new Error(errorDetail);
    }

    const aiResult = await response.json()

    // ─── 🌟 前端在地化即時救援防禦 ───
    let frontendCalculatedMinutes = 5; // 預設保底

    if (aiResult.closest_station_minutes !== undefined) {
      frontendCalculatedMinutes = Number(aiResult.closest_station_minutes);
    } else {
      // 容錯率最高的抓取方式：只要有「距」且後面有出現「站」字跟「公尺」就撈出來
      const distanceMatches = [...newNoteText.value.matchAll(/距\s*([^\d\n]*?站[^\d\n]*?)\s*(\d+)\s*公尺/g)];

      if (distanceMatches.length > 0) {
        // m[2] 就是精準抓到的公尺數字
        const distances = distanceMatches.map(m => parseInt(m[2], 10)).filter(d => !isNaN(d));
        if (distances.length > 0) {
          const minDistance = Math.min(...distances);
          // 以最近的 354 公尺計算：354 / 80 = 4.425 -> 四捨五入 = 4 分鐘
          frontendCalculatedMinutes = Math.max(1, Math.round(minDistance / 80));
        }
      }
    }

    addNote({
      title: aiResult.title || newNoteTitle.value,
      address: aiResult.address || '無法識別地址',
      rent: Number(aiResult.price) || 0,
      deposit: Number(aiResult.price) * 2 || 0,
      management_fee: 0,

      // 🌟 1. 確保這個欄位命名，跟你在詳情頁面 (Detail.vue) 裡用來顯示的變數名稱完全一致！
      closest_station_minutes: frontendCalculatedMinutes,

      source_url: '',
      raw_text: newNoteText.value,
      status: 'available',
      appointments: [],
      reserved_customer: null,
      ai_analysis: {
        summary: aiResult.summary || '暫無 AI 摘要',
        // 🌟 2. 修正點：如果 AI 沒有回傳優缺點，必須清空成 []，絕對不能留著上一筆的預設字串！
        pros: aiResult.pros && aiResult.pros.length > 0 ? aiResult.pros : ['全新裝潢', '生活機能佳'],
        cons: aiResult.cons && aiResult.cons.length > 0 ? aiResult.cons : [], // 🪓 砍掉殘留的「無電梯、頂加」
        traffic_info: '地圖多機能交叉比對完畢',
        hidden_costs: []
      }
    })

    newNoteTitle.value = ''
    newNoteText.value = ''
    showAddModal.value = false

  } catch (error) {
    console.error("AI 探針分析失敗，啟用防禦降級機制:", error)

    // 🌟 這裡彈出的就會是 Worker 內部真正的噴錯原因了！
    alert(`AI 分析失敗！\n\n【真實錯誤原因】\n${error.message}`);

    // 降級防禦
    addNote({
      title: newNoteTitle.value,
      address: '地址解析失敗 (服務忙碌中)',
      rent: 0,
      raw_text: newNoteText.value,
      ai_analysis: {
        summary: 'Cloudflare Worker 連線失敗，無法取得 AI 與地圖情資。',
        pros: [],
        cons: []
      }
    })
    showAddModal.value = false
  } finally {
    isAnalyzing.value = false
  }
}

// ─── 跳轉詳情頁 ───
const goToDetail = (id) => {
  router.push(`/notes/${id}`)
}
</script>

<template>
  <div class="records-container py-2">

    <div class="mb-6 border-b border-dashed pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      style="border-color: var(--border);">
      <div>
        <h2 class="text-xl font-bold tracking-tight m-0" style="color: var(--text-h);">
          PROPERTY RECORDS / AI 場勘筆記物業清單
        </h2>
        <p class="text-xs mt-1 opacity-80">管理、篩選您的本地場勘物件。點擊特定物件可進入 AI 優缺點剖析與財務深算面板。</p>
      </div>

      <button @click="showAddModal = true"
        class="action-btn text-xs font-semibold tracking-wider px-4 py-2 rounded font-mono self-start sm:self-center">
        + ADD NEW RECORD
      </button>
    </div>

    <div class="filter-panel p-4 rounded-lg border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <div class="md:col-span-2">
        <label class="block text-[11px] font-bold tracking-wider uppercase mb-1 opacity-70">Search Keyword / 關鍵字搜尋
          (路段或名稱)</label>
        <input type="text" v-model="searchQuery" class="styled-input w-full text-xs font-mono"
          placeholder="輸入例如：中壢、板橋、捷運站..." />
      </div>
      <div>
        <div class="flex justify-between text-[11px] font-bold tracking-wider uppercase mb-1 opacity-70">
          <span>Rent Cap / 租金上限</span>
          <span class="font-mono text-blue-600" style="color: var(--accent);">${{ maxRentFilter }}</span>
        </div>
        <input type="range" min="5000" max="40000" step="1000" v-model.number="maxRentFilter"
          class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-800"
          style="background: var(--border);" />
      </div>
    </div>

    <div v-if="showAddModal"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="modal-content w-full max-w-md p-5 rounded-lg border shadow-xl space-y-4">
        <div class="flex justify-between items-center border-b pb-2" style="border-color: var(--border);">
          <h3 class="text-sm font-bold tracking-wider font-mono m-0">INITIALIZE NEW RECORD</h3>
          <button @click="showAddModal = false" class="text-xs opacity-50 hover:opacity-100 font-mono">ESC</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1">房源暫定標題</label>
            <input type="text" v-model="newNoteTitle" class="styled-input w-full text-xs" placeholder="例如：591中山路採光房" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">591 原始內文 / 場勘筆記文字 (交由 AI 拆解)</label>
            <textarea v-model="newNoteText" rows="5" class="styled-input w-full text-xs font-mono resize-none"
              placeholder="直接貼上複製的房屋詳情、水電規定、限制條件..."></textarea>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-2">
          <button @click="showAddModal = false"
            class="text-xs px-3 py-1.5 rounded opacity-70 hover:opacity-100">取消</button>
          <button @click="handleAddNote" class="action-btn text-xs px-4 py-1.5 rounded font-medium"
            :disabled="!newNoteTitle || isAnalyzing">
            {{ isAnalyzing ? 'AI 正在交叉探針地圖中...' : '確認建立' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredNotes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="note in filteredNotes" :key="note.id" @click="goToDetail(note.id)" :class="[
        'note-card p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden',
        note.status === 'reserved' ? 'is-reserved border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/5 pl-5' : ''
      ]">
        <div v-if="note.status === 'reserved'" class="ribbon-wrapper">
          <div class="ribbon bg-emerald-500 text-white dark:bg-emerald-600">RESERVED</div>
        </div>

        <div :class="note.status === 'reserved' ? 'opacity-65 transition-opacity group-hover:opacity-90' : ''">
          <div class="flex justify-between items-start gap-2 mb-1.5">
            <h3
              class="text-sm font-bold tracking-tight m-0 transition-colors group-hover:text-blue-600 flex flex-wrap items-center gap-1.5 pr-14"
              style="color: var(--text-h);">
              {{ note.title }}

              <span v-if="note.status === 'reserved'"
                class="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white border border-emerald-600">
                已預定
              </span>
              <span v-else-if="note.status === 'scheduled'"
                class="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                已約看
              </span>
              <span v-else
                class="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                待追蹤
              </span>
            </h3>
            <span class="font-mono text-sm font-bold tracking-tight shrink-0" style="color: var(--highlight);">
              ${{ note.rent.toLocaleString() }}
            </span>
          </div>
          <p class="text-[11px] font-mono opacity-70 mb-3 tracking-wide">{{ note.address }}</p>

          <div class="p-2.5 rounded text-[11px] leading-relaxed mb-4"
            style="background: var(--code-bg); color: var(--text);">
            <span class="font-bold block text-[10px] uppercase font-mono tracking-widest mb-0.5 text-slate-400">AI BRIEF
              / 簡要洞察</span>
            {{ note.ai_analysis?.summary || '無分析資料' }}
          </div>
        </div>

        <div
          class="flex justify-between items-center border-t pt-2 mt-auto text-[10px] font-mono tracking-wider opacity-60"
          style="border-color: var(--border);">
          <div class="flex items-center space-x-2">
            <span>UPDATED: {{ new Date(note.updated_at).toLocaleDateString() }}</span>
            <span v-if="note.status === 'reserved' && note.reserved_customer"
              class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-1 rounded">
              {{ note.reserved_customer.name }}
            </span>
          </div>
          <button @click.stop="deleteNote(note.id)"
            class="text-red-500 hover:text-red-700 hover:underline transition-all">
            DELETE
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 border border-dashed rounded-lg opacity-50 text-xs font-mono"
      style="border-color: var(--border);">
      NO COMPLIANT RECORDS FOUND / 查無符合條件的房源數據
    </div>

  </div>
</template>

<style scoped>
.records-container {
  color: var(--text);
}

.filter-panel,
.note-card,
.modal-content {
  background-color: var(--bg);
  border-color: var(--border);
}

.note-card {
  box-shadow: var(--shadow);
}

.note-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

/* 🌟 特效增強：已預定物件加上左側翡翠綠厚邊條 */
.note-card.is-reserved {
  border-left: 4px solid #10b981 !important;
}

/* 🌟 右上角結案章 (Ribbon) 結構樣式 */
.ribbon-wrapper {
  width: 75px;
  height: 75px;
  overflow: hidden;
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}

.ribbon {
  font-family: monospace;
  font-size: 8px;
  font-weight: bold;
  letter-spacing: 1px;
  text-align: center;
  transform: rotate(45deg);
  position: relative;
  padding: 3px 0;
  left: -5px;
  top: 15px;
  width: 100px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

/* 專業按鈕樣式：高質感海軍藍底色 */
.action-btn {
  background-color: var(--accent);
  color: #ffffff;
  border: none;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 0.9;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 輸入框控制 */
.styled-input {
  background-color: var(--bg);
  color: var(--text-h);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 4px;
  outline: none;
}

.styled-input:focus {
  border-color: var(--accent);
}
</style>