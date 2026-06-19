<script setup>
import { ref, computed } from 'vue'
import { useCalculatorView } from '../composables/useCalculatorView'
// 引入資料存取層
import { useStorage } from '../composables/useStorage'

// ─── 接收外部傳入的筆記資料與宣告 Emit ───
const props = defineProps({
  initialNoteData: {
    type: Object,
    default: () => null
  }
})
const emit = defineEmits(['data-imported'])

// ─── 使用抽離後的邏輯層 ───
const {
  monthlyIncome,
  identityType,
  houseForm,
  extraOpts,
  agentForm,
  shareSelectValue,
  subsidySelectValue,
  customSharePeople,
  customSubsidyPeople,
  isCustomShare,
  isCustomSubsidy,
  calculationResult,
  upSellingAdvice,
  shareButtonText,
  handleShare,
  resetForm,
  importNoteData
} = useCalculatorView(props, emit)
// ─── 導入筆記彈窗互動與搜尋邏輯 ───
const { notes } = useStorage()
const isModalOpen = ref(false)
const importSearchQuery = ref('') // 🌟 彈窗專用的搜尋關鍵字

const openImportModal = () => {
  importSearchQuery.value = '' // 開啟時清空搜尋
  isModalOpen.value = true
}

const closeImportModal = () => {
  isModalOpen.value = false
}

// 🌟 動態過濾：排除「已預定 (reserved)」並支持關鍵字搜尋
const selectableNotes = computed(() => {
  return notes.value.filter(note => {
    // 1. 條件一：只有非預定的才可以 import
    const isNotReserved = note.status !== 'reserved'

    // 2. 條件二：搜尋關鍵字比對 (標題或地址)
    const matchesKeyword =
      note.title.toLowerCase().includes(importSearchQuery.value.toLowerCase()) ||
      (note.address && note.address.toLowerCase().includes(importSearchQuery.value.toLowerCase()))

    return isNotReserved && matchesKeyword
  })
})

const handleSelectNote = (note) => {
  // 呼叫邏輯層的導入方法
  importNoteData(note)
  closeImportModal()
}

// ─── 原本對外暴露的方法保持不變 ───
defineExpose({
  importNoteData,
  resetForm
})
</script>

<template>
  <div class="calculator-container py-1 px-1 sm:p-2 max-w-full overflow-hidden">

    <div class="mb-5 border-b border-dashed pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style="border-color: var(--border);">
      <div class="min-w-0">
        <h2 class="text-lg sm:text-xl font-bold tracking-tight m-0 text-ellipsis overflow-hidden whitespace-nowrap"
          style="color: var(--text-h);">
          FINANCIAL AUDIT / 租屋財務精算評估
        </h2>
        <p class="text-[11px] sm:text-xs mt-1 opacity-80 leading-normal">
          請輸入您的財務基線與目標房源條件，系統將即時交叉運算。
        </p>
      </div>

      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <button @click="openImportModal"
          class="import-btn flex-1 sm:flex-none text-[11px] sm:text-xs font-mono font-bold px-3 py-1.5 rounded border transition-all duration-200 tracking-wider whitespace-nowrap"
          style="background-color: var(--accent-bg); color: var(--accent); border-color: var(--accent-border);"
          onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          IMPORT NOTE
        </button>
        <button @click="resetForm"
          class="reset-btn flex-1 sm:flex-none text-[11px] sm:text-xs font-mono px-3 py-1.5 rounded border transition-all duration-200 tracking-wider whitespace-nowrap">
          RESET FORM
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-start">

      <div class="space-y-4 sm:space-y-5">

        <div class="form-section p-3 sm:p-4 rounded-lg border shadow-sm">
          <h3
            class="text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 font-mono whitespace-nowrap overflow-hidden text-ellipsis"
            style="color: var(--accent);">
            01. Client Baseline / 個人財務基線
          </h3>
          <div class="space-y-3">
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">每月淨收入 (TWD)</label>
              <input type="number" v-model.number="monthlyIncome" class="styled-input w-full font-mono text-sm"
                placeholder="例如: 45000" />
            </div>
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">政府租金補貼專案加碼資格</label>
              <select v-model="identityType" class="styled-input w-full text-xs sm:text-sm truncate">
                <option value="none">一般身分 (無特定加碼條件)</option>
                <option value="single">成年單身青年 (18-39歲加碼 1.2 倍)</option>
                <option value="newlywed">新婚家庭 (2年內加碼 1.3 倍)</option>

                <!-- 補上弱勢族群選項 -->
                <option value="social_disadvantage">社會弱勢 (身障/原住民/65歲以上長者等加碼 1.2 倍)</option>
                <option value="economic_disadvantage">經濟弱勢 (低收入戶 / 中低收入戶加碼 1.4 倍)</option>

                <!-- 視需求可自由決定是否加上育兒族群 (育兒也是大宗，加碼 1.4~1.8倍以上) -->
                <option value="raised_child">育兒家庭 (育有未成年子女，依人數加碼 1.4 倍起)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section p-3 sm:p-4 rounded-lg border shadow-sm">
          <h3
            class="text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 font-mono whitespace-nowrap overflow-hidden text-ellipsis"
            style="color: var(--accent);">
            02. Property Conditions / 目標房源參數
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">房源參考標題 (選填)</label>
              <input type="text" v-model="houseForm.title" class="styled-input w-full text-sm"
                placeholder="例如：站前精緻套房" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 flex justify-between items-center gap-2">
                <span class="whitespace-nowrap">完整地址或縣市路段</span>
                <span
                  class="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)] whitespace-nowrap shrink-0">
                  補貼分級：{{ calculationResult?.detectedCity }}
                </span>
              </label>
              <input type="text" v-model="houseForm.address" class="styled-input w-full text-sm"
                placeholder="輸入縣市與區域以精準計算" />
            </div>
            <div class="col-span-1">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">月租金 (純房租)</label>
              <input type="number" v-model.number="houseForm.rent" class="styled-input w-full font-mono text-sm" />
            </div>
            <div class="col-span-1">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">每月管理費</label>
              <input type="number" v-model.number="houseForm.management_fee"
                class="styled-input w-full font-mono text-sm" />
            </div>

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">房東政策 / 租金補貼可行性</label>
              <select v-model="houseForm.allow_subsidy" class="styled-input w-full text-xs sm:text-sm truncate"
                :class="!houseForm.allow_subsidy ? 'border-amber-500/80 text-amber-600 dark:text-[var(--highlight)]' : ''">
                <option :value="true">允許申報租金補貼（系統正常發放補貼）</option>
                <option :value="false">拒絕申報租金補貼（強制取消並扣分）</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section p-3 sm:p-4 rounded-lg border shadow-sm">
          <h3
            class="text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 font-mono whitespace-nowrap overflow-hidden text-ellipsis"
            style="color: var(--accent);">
            03. Multi-Person & Weights / 隱性成本與合租分配
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div class="space-y-1">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">總合租分攤人數</label>
              <select v-model="shareSelectValue" class="styled-input w-full text-xs sm:text-sm truncate">
                <option value="1">1 人獨住</option>
                <option value="2">2 人合租 / 情侶均攤</option>
                <option value="3">3 人共租</option>
                <option value="4">4 人共租</option>
                <option value="custom">其他（自行輸入）</option>
              </select>
              <div v-if="isCustomShare" class="pt-1">
                <input type="number" v-model.number="customSharePeople" min="1"
                  class="styled-input w-full font-mono text-sm" placeholder="輸入合租人數" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">其中符合並申請租補人數</label>
              <select v-model="subsidySelectValue" class="styled-input w-full text-xs sm:text-sm truncate"
                :disabled="!houseForm.allow_subsidy"
                :class="!houseForm.allow_subsidy ? 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''">
                <option value="0">0 人（皆不申請）</option>
                <option value="1" v-if="extraOpts.sharePeople >= 1">1 人申請補貼</option>
                <option value="2" v-if="extraOpts.sharePeople >= 2">2 人同時申請（雙租補）</option>
                <option value="3" v-if="extraOpts.sharePeople >= 3">3 人同時申請</option>
                <option value="4" v-if="extraOpts.sharePeople >= 4">4 人同時申請</option>
                <option value="custom" v-if="extraOpts.sharePeople > 4 || isCustomShare">其他（自行輸入）</option>
              </select>
              <div v-if="isCustomSubsidy && houseForm.allow_subsidy" class="pt-1">
                <input type="number" v-model.number="customSubsidyPeople" min="0" :max="extraOpts.sharePeople"
                  class="styled-input w-full font-mono text-sm" placeholder="輸入補貼人數" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 border-t pt-3" style="border-color: var(--border);">
            <div>
              <label
                class="block text-[10px] sm:text-[11px] font-medium mb-1 text-center sm:text-left whitespace-nowrap overflow-hidden text-ellipsis">預估水電/月
                (TWD)</label>
              <input type="number" v-model.number="extraOpts.estimatedUtility"
                class="styled-input w-full font-mono text-center sm:text-left text-xs px-1 sm:px-2" />
            </div>
            <div>
              <label
                class="block text-[10px] sm:text-[11px] font-medium mb-1 text-center sm:text-left whitespace-nowrap overflow-hidden text-ellipsis">至最近交通站點
                (分)</label>
              <input type="number" v-model.number="houseForm.closest_station_minutes"
                class="styled-input w-full font-mono text-center sm:text-left text-xs px-1 sm:px-2"
                placeholder="如捷運/火車站" />
            </div>
          </div>
        </div>

        <div class="form-section p-3 sm:p-4 rounded-lg border shadow-sm">
          <h3
            class="text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 font-mono whitespace-nowrap overflow-hidden text-ellipsis"
            style="color: var(--accent);">
            04. Agent Contact / 房仲聯絡資訊
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">房仲姓名</label>
              <input type="text" v-model="agentForm.name" class="styled-input w-full text-sm" placeholder="例如: 陳專員" />
            </div>
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">聯絡電話</label>
              <input type="tel" v-model="agentForm.phone" class="styled-input w-full font-mono text-sm"
                placeholder="例如: 0912345678" />
            </div>
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">LINE ID</label>
              <input type="text" v-model="agentForm.lineId" class="styled-input w-full font-mono text-sm"
                placeholder="請輸入 LINE ID" />
            </div>
            <div>
              <label class="block text-[11px] sm:text-xs font-medium mb-1 whitespace-nowrap">Instagram (IG)</label>
              <input type="text" v-model="agentForm.instagram" class="styled-input w-full font-mono text-sm"
                placeholder="@帳號名稱" />
            </div>
          </div>
        </div>

      </div>

      <div class="md:sticky md:top-20 space-y-4 w-full">

        <div class="report-card p-4 sm:p-5 rounded-lg border text-center relative overflow-hidden shadow-sm">
          <div class="absolute top-0 left-0 right-0 h-1" style="background-color: var(--accent);"></div>

          <span class="text-[10px] font-mono tracking-widest opacity-60 uppercase block mb-1 whitespace-nowrap">
            Suitability Score / 綜合適合度
          </span>

          <div class="my-1 sm:my-2 font-mono text-4xl sm:text-5xl font-bold tracking-tight"
            :class="calculationResult?.levelColor">
            {{ calculationResult?.score }}<span class="text-xs font-sans opacity-60 text-slate-500"> / 100</span>
          </div>

          <div
            class="inline-block px-3 py-1 rounded text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap"
            style="background: var(--code-bg); color: var(--text-h);">
            評級結果：<span :class="calculationResult?.levelColor">{{ calculationResult?.level }}</span>
          </div>

          <div class="mt-4 pt-1">
            <button @click="handleShare"
              class="w-full text-xs font-bold py-2 px-4 rounded transition-all duration-200 shadow-sm border font-mono tracking-wide"
              style="background-color: var(--accent); color: #fff; border-color: var(--accent);"
              onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
              {{ shareButtonText }}
            </button>
          </div>
        </div>

        <div v-if="upSellingAdvice.shouldRecommend"
          class="p-4 rounded-lg border text-xs space-y-3 transition-all duration-300 border-amber-500/30"
          style="background-color: rgba(217, 119, 6, 0.05);">
          <div class="flex items-center justify-between border-b pb-1.5 border-amber-500/20 gap-2">
            <span
              class="font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase whitespace-nowrap overflow-hidden text-ellipsis">
              UPGRADE STRATEGY / 高端車道建議
            </span>
            <span
              class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-white font-bold whitespace-nowrap shrink-0">精準空間</span>
          </div>

          <p class="leading-relaxed opacity-90 text-[11px] sm:text-xs">
            當前物件對您的財務基線而言非常輕鬆。以您的收入結構而言，在此合租編制下，您個人每月仍有
            <span class="font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{{
              upSellingAdvice.availableMarginPerPerson }} 元</span>
            的安全升級彈性。
          </p>

          <div class="p-2.5 rounded bg-amber-500/5 border border-amber-500/10 space-y-1 text-[11px] sm:text-xs">
            <div class="flex justify-between">
              <span class="opacity-80">您個人的理想房租分攤範圍：</span>
              <span class="font-mono font-bold text-amber-700 dark:text-amber-300">
                {{ upSellingAdvice.personalMinRent }} ~ {{ upSellingAdvice.personalMaxRent }} 元 / 人
              </span>
            </div>
            <div class="flex justify-between border-t border-dashed border-amber-500/20 pt-1 mt-1">
              <span class="opacity-80">同編制下建議主推房源總租金：</span>
              <span class="font-mono font-bold text-amber-700 dark:text-amber-300">
                {{ upSellingAdvice.suggestedMinRent }} ~ {{ upSellingAdvice.suggestedMaxRent }} 元 / 總價
              </span>
            </div>
          </div>
        </div>

        <div class="p-3 sm:p-4 rounded-lg border space-y-3 shadow-sm" style="background-color: var(--code-bg);">
          <h4
            class="text-[11px] sm:text-xs font-bold tracking-wider uppercase border-b pb-2 font-mono flex justify-between items-center gap-2"
            style="color: var(--text-h); border-color: var(--border);">
            <span class="whitespace-nowrap">Financial Breakdown / 個人資金支出明細</span>
            <span v-if="(extraOpts.sharePeople || 1) > 1"
              class="text-[9px] sm:text-[10px] text-amber-600 font-sans font-bold whitespace-nowrap shrink-0">
              (已按 {{ extraOpts.sharePeople }} 人分攤拆解)
            </span>
          </h4>

          <div class="text-[11px] sm:text-xs space-y-2.5">
            <div class="flex justify-between items-center gap-2">
              <span class="opacity-80 truncate">個人固定房租 ＋ 管理費分攤</span>
              <span class="font-mono font-medium whitespace-nowrap">
                {{ calculationResult?.personalRentAndFee || 0 }} 元
              </span>
            </div>
            <div class="flex justify-between items-center gap-2">
              <span class="opacity-80 truncate">個人預估水電分攤費用</span>
              <span class="font-mono font-medium whitespace-nowrap">+ {{ calculationResult?.personalUtility || 0 }}
                元</span>
            </div>

            <div class="flex justify-between items-center gap-2 font-medium"
              :class="calculationResult?.isAllowSubsidy && extraOpts.subsidyPeople > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through opacity-60'">
              <span class="truncate">
                <span v-if="!calculationResult?.isAllowSubsidy">房東拒絕申報租金補貼</span>
                <span v-else-if="extraOpts.subsidyPeople === 0">無人申請租金補貼</span>
                <span v-else class="truncate">個人專屬中央租金補貼</span>
              </span>
              <span class="font-mono whitespace-nowrap">- {{ calculationResult?.subsidy || 0 }} 元</span>
            </div>

            <div class="border-t border-dashed my-2 pt-2.5 flex justify-between items-baseline gap-2"
              style="border-color: var(--border);">
              <span class="font-bold whitespace-nowrap" style="color: var(--text-h);">
                {{ (extraOpts.sharePeople || 1) > 1 ? '個人實際每月淨流出' : '每月實際總淨流出' }}
              </span>
              <span class="text-base sm:text-lg font-bold font-mono whitespace-nowrap" style="color: var(--highlight);">
                $ {{ calculationResult?.finalRealCost }} <span class="text-xs font-normal opacity-70">元 / 月</span>
              </span>
            </div>
          </div>
        </div>

        <div
          class="p-3 sm:p-4 rounded-lg border text-[11px] sm:text-xs space-y-3 shadow-sm transition-colors duration-300">
          <div class="flex items-center justify-between gap-2">
            <span class="opacity-80 leading-normal">
              {{ (extraOpts.sharePeople || 1) > 1 ? '個人分攤租金佔總收入比重：' : '房租固定支出佔總收入比重：' }}
            </span>
            <span class="font-mono text-xs sm:text-sm font-bold whitespace-nowrap shrink-0"
              :class="Number(calculationResult?.financialRatio) > 33.3 ? 'text-amber-600 dark:text-[var(--highlight)]' : 'text-emerald-600 dark:text-emerald-400'">
              {{ calculationResult?.financialRatio }} %
            </span>
          </div>

          <p v-if="Number(calculationResult?.financialRatio) > 33.3"
            class="text-[11px] p-2.5 sm:p-3 rounded-lg border transition-colors duration-300 leading-relaxed"
            style="background-color: var(--highlight-bg); border-color: var(--highlight); color: var(--highlight);">
            [警告] 固定支出已超過您月收入的 1/3（黃金警戒線），將會顯著擠壓日常儲蓄，請審慎評估。
          </p>

          <p v-else
            class="text-[11px] p-2.5 sm:p-3 rounded-lg border transition-colors duration-300 leading-relaxed text-emerald-700 dark:text-emerald-400"
            style="background-color: var(--accent-bg); border-color: var(--accent-border);">
            [財務安全] 個人房租分攤結構處於安全水位，符合理性資產配置比例。
          </p>
        </div>

      </div>

    </div>

    <div v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="closeImportModal">
      <div class="w-full max-w-md rounded-lg border p-4 shadow-xl flex flex-col max-h-[80vh]"
        style="background-color: var(--bg); border-color: var(--border);">

        <div class="flex items-center justify-between pb-2 border-b border-dashed" style="border-color: var(--border);">
          <h3 class="text-xs font-bold font-mono tracking-wider" style="color: var(--text-h);">SELECT NOTE / 選擇欲精算的筆記
          </h3>
          <button @click="closeImportModal" class="text-xs opacity-50 hover:opacity-100 font-mono">CLOSE</button>
        </div>

        <div class="mt-2">
          <input type="text" v-model="importSearchQuery" class="styled-input w-full text-xs font-mono"
            placeholder="搜尋房源名稱或地址 (例如：中壢...)" />
        </div>

        <div class="overflow-y-auto py-2 space-y-2 flex-1 mt-2">
          <div v-if="selectableNotes.length === 0" class="text-center py-6 text-[11px] opacity-50 font-mono">
            NO AVAILABLE RECORDS FOUND / 無符合條件的待追蹤房源
          </div>

          <div v-for="note in selectableNotes" :key="note.id" @click="handleSelectNote(note)"
            class="p-2.5 rounded border border-dashed cursor-pointer hover:border-solid transition-all duration-150 group text-left relative overflow-hidden"
            style="background-color: var(--code-bg); border-color: var(--border);"
            onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <div class="absolute left-0 top-0 bottom-0 w-1"
              :style="{ backgroundColor: note.status === 'scheduled' ? '#3b82f6' : '#94a3b8' }"></div>

            <div class="flex justify-between items-start gap-2 pl-1.5">
              <span class="text-xs font-bold line-clamp-1 group-hover:text-[var(--accent)]"
                style="color: var(--text-h);">
                {{ note.title }}
                <span v-if="note.status === 'scheduled'"
                  class="text-[9px] ml-1 px-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-normal">已約看</span>
              </span>
              <span class="text-xs font-mono font-bold shrink-0 text-emerald-600 dark:text-emerald-400">
                ${{ note.rent.toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between items-center text-[10px] opacity-60 mt-1 font-mono pl-1.5">
              <span class="truncate max-w-[200px]">{{ note.address || '無登記路段' }}</span>
              <span>站點 {{ note.closest_station_minutes || 5 }} 分</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.calculator-container {
  color: var(--text);
}

.form-section,
.report-card {
  background-color: var(--bg);
  border-color: var(--border);
}

.reset-btn {
  background-color: var(--bg);
  color: var(--text-h);
  border-color: var(--border);
}

.reset-btn:hover {
  background-color: var(--code-bg);
  border-color: var(--text);
}

.styled-input {
  background-color: var(--bg);
  color: var(--text-h);
  border: 1px solid var(--border);
  padding: 6px 10px;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;
}

.styled-input:focus {
  border-color: var(--accent);
}
</style>