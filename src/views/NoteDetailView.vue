<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage'
import { useCalculator } from '../composables/useCalculator'

const route = useRoute()
const router = useRouter()
const { getNoteById, updateNote } = useStorage()

const { evaluateNotePurely } = useCalculator()

const noteId = route.params.id
const note = ref(null)

// ─── 隱性成本與機能加權狀態 ───
const extraOpts = ref({
  estimatedUtility: 1000,
  sharePeople: 1,
  subsidyPeople: 1
})

// ─── 新增/編輯預約的暫存表單 ───
const newAppForm = ref({
  name: '',
  phone: '',
  appointment_time: '',
  notes: ''
})

// ─── 載入資料 ───
onMounted(() => {
  const fetchedNote = getNoteById(noteId)
  if (fetchedNote) {
    note.value = fetchedNote

    // 🌟 保底防呆：如果這筆舊資料沒有這個欄位，給他一個預設值
    if (note.value.closest_station_minutes === undefined) {
      note.value.closest_station_minutes = 5
    }

    if (fetchedNote.extraOpts) {
      extraOpts.value.estimatedUtility = fetchedNote.extraOpts.estimatedUtility ?? 1000
      extraOpts.value.sharePeople = fetchedNote.extraOpts.sharePeople ?? 1
      extraOpts.value.subsidyPeople = fetchedNote.extraOpts.subsidyPeople ?? 1
    }
  } else {
    router.replace('/notes')
  }
})

// ─── 🌟 核心改動：根據房源狀態，動態過濾顯示的客戶名單 ───
const filteredAppointments = computed(() => {
  if (!note.value || !note.value.appointments) return []

  // 如果是待追蹤狀態，只顯示「沒有填寫看房時間」的潛在客戶
  if (note.value.status === 'available') {
    return note.value.appointments.filter(app => !app.appointment_time || app.appointment_time.trim() === '')
  }

  // 如果是已預約看房狀態，只顯示「有明確看房時間」的行程
  if (note.value.status === 'scheduled') {
    return note.value.appointments.filter(app => app.appointment_time && app.appointment_time.trim() !== '')
  }

  // 如果已經預定成交，就顯示全部預約歷史紀錄
  return note.value.appointments
})

const liveAuditResult = computed(() => {
  if (!note.value) return null
  return evaluateNotePurely(note.value, extraOpts.value)
})

// ─── 就地編輯即時同步 ───
const handleFieldChange = () => {
  if (note.value) {
    if (!note.value.ai_analysis) {
      note.value.ai_analysis = {}
    }

    updateNote(noteId, {
      ...note.value,
      title: note.value.title,
      address: note.value.address,
      rent: Number(note.value.rent),
      management_fee: Number(note.value.management_fee),
      source_url: note.value.source_url,

      status: note.value.status,
      appointments: [...note.value.appointments],
      reserved_customer: note.value.reserved_customer ? { ...note.value.reserved_customer } : null,

      ai_analysis: {
        ...note.value.ai_analysis,
        summary: note.value.ai_analysis.summary,
        pros: note.value.ai_analysis.pros ? [...note.value.ai_analysis.pros] : [],
        cons: note.value.ai_analysis.cons ? [...note.value.ai_analysis.cons] : [],
        hidden_costs: note.value.ai_analysis.hidden_costs ? [...note.value.ai_analysis.hidden_costs] : [],
        traffic_info: note.value.ai_analysis.traffic_info
      },
      closest_station_minutes: Number(note.value.closest_station_minutes),
      extraOpts: { ...extraOpts.value }
    })
  }
}

// ─── 快速管理：新增與刪除看房預約 ───
const addAppointment = () => {
  if (!newAppForm.value.name) return

  // 智能防呆：如果在「已預約」面板新增卻沒填時間，自動幫忙打上「待確認」，確保它能留在已預約面板
  if (note.value.status === 'scheduled' && !newAppForm.value.appointment_time) {
    newAppForm.value.appointment_time = '時間待確認'
  }

  // 取得該項目的原始 Index（用於追蹤或刪除）
  note.value.appointments.push({
    id: 'app_' + Date.now(),
    ...newAppForm.value
  })

  newAppForm.value = { name: '', phone: '', appointment_time: '', notes: '' }
  handleFieldChange()
}

// 修改：透過唯一 ID 去刪除原始陣列中的項目
const removeAppointmentById = (id) => {
  const idx = note.value.appointments.findIndex(app => app.id === id)
  if (idx !== -1) {
    note.value.appointments.splice(idx, 1)
    handleFieldChange()
  }
}

// ─── 快速成交 ───
const convertToReserved = (app) => {
  note.value.status = 'reserved'
  note.value.reserved_customer = {
    name: app.name,
    phone: app.phone,
    notes: app.notes || '由預約看房名單快速轉為成交預定'
  }
  handleFieldChange()
}

const cancelReservation = () => {
  if (!note.value) return
  note.value.status = 'scheduled'
  note.value.reserved_customer = null
  handleFieldChange()
}

// ─── AI 區塊用 ───
const addItem = (type) => {
  if (!note.value.ai_analysis) note.value.ai_analysis = {}
  if (!note.value.ai_analysis[type]) note.value.ai_analysis[type] = []

  note.value.ai_analysis[type].push('')
  handleFieldChange()
}

const removeItem = (type, index) => {
  if (note.value?.ai_analysis?.[type]) {
    note.value.ai_analysis[type].splice(index, 1)
    handleFieldChange()
  }
}

watch(extraOpts, () => {
  handleFieldChange()
}, { deep: true })
</script>

<template>
  <div v-if="note" class="detail-container py-2">

    <div class="mb-5 border-b border-dashed pb-4 flex items-center justify-between"
      style="border-color: var(--border);">
      <button @click="router.push('/notes')"
        class="text-xs font-mono opacity-70 hover:opacity-100 flex items-center space-x-1">
        <span>BACK TO RECORDS</span>
      </button>
      <span class="text-[10px] font-mono opacity-50">REF_ID: {{ note.id }}</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

      <!-- 左側區塊：規格欄位 -->
      <div class="md:col-span-1 space-y-5">
        <div class="detail-card p-4 rounded-lg border space-y-3">
          <h3 class="text-xs font-bold tracking-widest uppercase mb-1 font-mono" style="color: var(--accent);">
            SPECIFICATIONS / 物業規格
          </h3>
          <div>
            <label class="block text-[10px] font-bold opacity-60 mb-1">房源名稱</label>
            <input type="text" v-model="note.title" @input="handleFieldChange"
              class="styled-input w-full text-xs font-medium" />
          </div>
          <div>
            <label class="block text-[10px] font-bold opacity-60 mb-1">標的物路段地址</label>
            <input type="text" v-model="note.address" @input="handleFieldChange" class="styled-input w-full text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold opacity-60 mb-1">月租金 (TWD)</label>
              <input type="number" v-model.number="note.rent" @input="handleFieldChange"
                class="styled-input w-full font-mono text-xs" />
            </div>
            <div>
              <label class="block text-[10px] font-bold opacity-60 mb-1">管理費 (TWD)</label>
              <input type="number" v-model.number="note.management_fee" @input="handleFieldChange"
                class="styled-input w-full font-mono text-xs" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold opacity-60 mb-1">591 來源網址</label>
            <input type="text" v-model="note.source_url" @input="handleFieldChange"
              class="styled-input w-full text-[11px] font-mono text-blue-600 underline" placeholder="https://..." />
          </div>
        </div>

        <div class="detail-card p-4 rounded-lg border space-y-3">
          <h3 class="text-xs font-bold tracking-widest uppercase mb-1 font-mono" style="color: var(--accent);">
            DYNAMIC TUNING / 附加機能與附加成本
          </h3>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div>
              <label class="block text-[9px] font-bold opacity-60 mb-1">至最近站點 (分)</label>
              <input type="number" v-model.number="note.closest_station_minutes" @input="handleFieldChange"
                class="styled-input w-full text-center font-mono text-xs p-1" placeholder="如火車站/捷運" />
            </div>
            <div>
              <label class="block text-[9px] font-bold opacity-60 mb-1">預估水電/月 (TWD)</label>
              <input type="number" v-model.number="extraOpts.estimatedUtility"
                class="styled-input w-full text-center font-mono text-xs p-1" />
            </div>
          </div>
        </div>

        <div class="detail-card p-4 rounded-lg border">
          <h3 class="text-xs font-bold tracking-widest uppercase mb-2 font-mono" style="color: var(--text-h);">
            RAW CONTENT / 原始採集內文
          </h3>
          <div
            class="text-[11px] font-mono p-2.5 rounded border border-dashed overflow-y-auto max-h-40 leading-relaxed text-slate-500"
            style="background-color: var(--code-bg); border-color: var(--border);">
            {{ note.raw_text || '無原始場勘文字紀錄。' }}
          </div>
        </div>
      </div>

      <!-- 右側區塊：診斷與 CRM -->
      <div class="md:col-span-2 space-y-4">
        <div
          class="audit-banner p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1" style="background-color: var(--highlight);"></div>
          <div class="text-center sm:text-left">
            <span class="text-[10px] font-mono tracking-wider block opacity-60">FINANCIAL AUDIT LEVEL / 財務適合度診斷</span>
            <div class="text-base font-bold mt-0.5" style="color: var(--text-h);">
              當前評級：<span :class="liveAuditResult?.levelColor">{{ liveAuditResult?.level }}</span>
            </div>
          </div>
          <div class="flex items-baseline space-x-4">
            <div class="text-center">
              <span class="text-[9px] opacity-60 block">適合度得分</span>
              <span class="font-mono text-2xl font-bold" :class="liveAuditResult?.levelColor">{{ liveAuditResult?.score
              }}</span>
            </div>
            <div class="w-px h-8 bg-slate-200"></div>
            <div class="text-center">
              <span class="text-[9px] opacity-60 block">真實淨流出 / 月</span>
              <span class="font-mono text-2xl font-bold" style="color: var(--highlight);">{{
                liveAuditResult?.finalRealCost }}</span>
            </div>
          </div>
        </div>

        <!-- CRM 區塊 -->
        <div class="detail-card p-4 rounded-lg border space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 mb-2"
            style="border-color: var(--border);">
            <h3 class="text-xs font-bold tracking-widest uppercase font-mono" style="color: var(--accent);">
              CRM CUSTOMER MANAGEMENT / 客戶排程與狀態管理
            </h3>
            <div
              class="flex items-center space-x-1 mt-2 sm:mt-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[11px] font-mono">
              <button @click="note.status = 'available'; handleFieldChange()"
                :class="['px-2 py-0.5 rounded transition-all', note.status === 'available' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm' : 'opacity-60']">
                待追蹤
              </button>
              <button @click="note.status = 'scheduled'; handleFieldChange()"
                :class="['px-2 py-0.5 rounded transition-all text-blue-600 dark:text-blue-400', note.status === 'scheduled' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm' : 'opacity-60']">
                已預約看房
              </button>
              <button @click="note.status = 'reserved'; handleFieldChange()"
                :class="['px-2 py-0.5 rounded transition-all text-emerald-600 dark:text-emerald-400', note.status === 'reserved' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm' : 'opacity-60']">
                已預定成功
              </button>
            </div>
          </div>

          <!-- 成交狀態面板 -->
          <div v-if="note.status === 'reserved'"
            class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-900 space-y-3">
            <div class="flex items-center justify-between">
              <div
                class="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                FINAL RESERVED CUSTOMER / 最終鎖定租客
              </div>
              <button @click="cancelReservation"
                class="text-[10px] font-mono text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-red-50">
                CANCEL RESERVATION
              </button>
            </div>
            <div v-if="note.reserved_customer" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] font-bold opacity-60 mb-1">客戶姓名</label>
                <input type="text" v-model="note.reserved_customer.name" @input="handleFieldChange"
                  class="styled-input w-full text-xs font-bold" />
              </div>
              <div>
                <label class="block text-[10px] font-bold opacity-60 mb-1">聯絡電話</label>
                <input type="text" v-model="note.reserved_customer.phone" @input="handleFieldChange"
                  class="styled-input w-full font-mono text-xs" />
              </div>
              <div>
                <label class="block text-[10px] font-bold opacity-60 mb-1">簽約或起租日備忘</label>
                <input type="text" v-model="note.reserved_customer.notes" @input="handleFieldChange"
                  class="styled-input w-full text-xs" />
              </div>
            </div>
          </div>

          <!-- 預約名單動態篩選面板 -->
          <div class="space-y-3">
            <div class="text-[11px] font-mono font-bold opacity-60 uppercase tracking-wider">
              <span v-if="note.status === 'available'">POTENTIAL CUSTOMERS / 洽談中潛在客（未定時間）</span>
              <span v-else-if="note.status === 'scheduled'">CONFIRMED APPOINTMENTS / 已排定看房行程</span>
              <span v-else>ALL APPOINTMENTS HISTORY / 所有看房紀錄歷史</span>
            </div>

            <!-- 🌟 改為使用過濾後的 filteredAppointments 變數 -->
            <div v-if="filteredAppointments.length" class="space-y-2">
              <div v-for="app in filteredAppointments" :key="app.id"
                class="p-2.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-900">

                <div class="space-y-1 grow">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-slate-800 dark:text-slate-200">{{ app.name }}</span>
                    <span class="font-mono text-slate-400">{{ app.phone }}</span>
                  </div>
                  <div v-if="app.notes" class="text-slate-400 text-[11px] italic">
                    備註: {{ app.notes }}
                  </div>

                  <div class="flex items-center space-x-2 pt-1">
                    <span class="text-[10px] font-mono text-slate-400 shrink-0">約看時間:</span>
                    <input type="text" v-model="app.appointment_time" @input="handleFieldChange"
                      placeholder="未定 (填寫後自動轉為預約行程)"
                      class="styled-input py-0.5 px-1.5 text-[11px] font-mono w-full max-w-[220px] bg-white dark:bg-slate-800 border-slate-200" />
                  </div>
                </div>

                <div class="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button v-if="note.status !== 'reserved'" @click="convertToReserved(app)"
                    class="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-mono font-bold hover:bg-emerald-700">
                    SET RESERVED
                  </button>
                  <button @click="removeAppointmentById(app.id)"
                    class="px-1.5 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-[10px]">
                    REMOVE
                  </button>
                </div>

              </div>
            </div>
            <div v-else
              class="text-xs text-slate-400 italic font-mono p-4 border border-dashed rounded text-center bg-slate-200/20">
              <span v-if="note.status === 'available'">當前無「待追蹤」的潛在客戶。</span>
              <span v-else-if="note.status === 'scheduled'">當前無「已約定時間」的看房排程。</span>
              <span v-else>暫無紀錄</span>
            </div>

            <!-- 快捷表單 -->
            <div class="pt-2 border-t border-dashed" style="border-color: var(--border);">
              <div class="text-[10px] font-mono font-bold opacity-50 mb-2">
                {{ note.status === 'available' ? '快速登記潛在追蹤客 (免填時間)' : '快速新增預約看房行程' }}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div>
                  <label class="block text-[9px] opacity-60 mb-0.5">姓名</label>
                  <input type="text" v-model="newAppForm.name" class="styled-input w-full text-xs p-1"
                    placeholder="客戶姓名" />
                </div>
                <div>
                  <label class="block text-[9px] opacity-60 mb-0.5">電話</label>
                  <input type="text" v-model="newAppForm.phone" class="styled-input w-full text-xs p-1 font-mono"
                    placeholder="09XX..." />
                </div>
                <div>
                  <label class="block text-[9px] opacity-60 mb-0.5">時間 (留白則列入待追蹤)</label>
                  <input type="text" v-model="newAppForm.appointment_time"
                    class="styled-input w-full text-xs p-1 font-mono" placeholder="例: 06-20 14:00" />
                </div>
                <div>
                  <button @click="addAppointment"
                    class="w-full py-1.5 bg-blue-600 text-white rounded font-mono text-xs font-bold hover:bg-blue-700">
                    + SAVE CUSTOMER
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方 AI 區塊保持原樣 -->
        <div class="detail-card p-5 rounded-lg border space-y-5">
          <div>
            <h3 class="text-xs font-bold tracking-widest uppercase font-mono m-0" style="color: var(--accent);">
              01. EXECUTIVE SUMMARY / 智能摘要 (可編輯)
            </h3>
            <div v-if="note.ai_analysis" class="mt-2">
              <textarea v-model="note.ai_analysis.summary" @input="handleFieldChange" rows="3"
                class="inline-textarea w-full text-xs leading-relaxed" placeholder="請輸入摘要..."></textarea>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style="border-color: var(--border);">

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-bold tracking-wider text-emerald-600 font-mono uppercase">
                  PROS / 核心優勢指標
                </h4>
                <button @click="addItem('pros')"
                  class="action-btn text-[9px] font-mono text-emerald-600 hover:underline">
                  + ADD ITEM
                </button>
              </div>
              <ul v-if="note.ai_analysis?.pros?.length" class="text-xs space-y-1 list-none pl-0">
                <li v-for="(pro, i) in note.ai_analysis.pros" :key="i"
                  class="list-item-group flex items-center space-x-1 group">
                  <span class="text-emerald-500 font-bold shrink-0 text-xs">-</span>
                  <input type="text" v-model="note.ai_analysis.pros[i]" @input="handleFieldChange"
                    class="inline-input w-full text-xs" placeholder="輸入新優勢..." />
                  <button @click="removeItem('pros', i)"
                    class="delete-btn opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs px-1 font-mono">
                    REMOVE
                  </button>
                </li>
              </ul>
              <p v-else class="text-[11px] opacity-50 italic font-mono">暫無優勢數據</p>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-bold tracking-wider text-red-500 font-mono uppercase">
                  CONS / RISK ANALYSIS
                </h4>
                <button @click="addItem('cons')" class="action-btn text-[9px] font-mono text-red-500 hover:underline">
                  + ADD ITEM
                </button>
              </div>
              <ul v-if="note.ai_analysis?.cons?.length" class="text-xs space-y-1 list-none pl-0">
                <li v-for="(con, i) in note.ai_analysis.cons" :key="i"
                  class="list-item-group flex items-center space-x-1 group">
                  <span class="text-red-400 font-bold shrink-0 text-xs">-</span>
                  <input type="text" v-model="note.ai_analysis.cons[i]" @input="handleFieldChange"
                    class="inline-input w-full text-xs text-red-600/90 dark:text-red-400" placeholder="輸入新隱憂..." />
                  <button @click="removeItem('cons', i)"
                    class="delete-btn opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs px-1 font-mono">
                    REMOVE
                  </button>
                </li>
              </ul>
              <p v-else class="text-[11px] opacity-50 italic font-mono">暫無劣勢數據</p>
            </div>

          </div>

          <div class="border-t pt-4 space-y-2" style="border-color: var(--border);">
            <div class="flex items-center justify-between">
              <h4 class="text-[11px] font-bold tracking-wider text-amber-600 font-mono uppercase">
                HIDDEN COSTS / 附加隱藏成本審查
              </h4>
              <button @click="addItem('hidden_costs')"
                class="action-btn text-[9px] font-mono text-amber-600 hover:underline">
                + ADD TAG
              </button>
            </div>
            <div v-if="note.ai_analysis?.hidden_costs?.length" class="flex flex-wrap gap-2">
              <div v-for="(cost, i) in note.ai_analysis.hidden_costs" :key="i"
                class="text-[10px] font-medium px-2 py-0.5 rounded border flex items-center space-x-1 group"
                style="background: var(--highlight-bg); border-color: var(--border);">
                <input type="text" v-model="note.ai_analysis.hidden_costs[i]" @input="handleFieldChange"
                  class="bg-transparent border-none outline-none p-0 text-[10px] font-medium"
                  style="color: var(--highlight); width: auto; min-width: 60px;" placeholder="新成本..." />
                <button @click="removeItem('hidden_costs', i)"
                  class="text-amber-700 dark:text-amber-400 opacity-40 hover:opacity-100 font-mono text-[11px] ml-1 shrink-0">
                  x
                </button>
              </div>
            </div>
            <p v-else class="text-[11px] opacity-50 italic font-mono">未偵測到隱藏成本。</p>
          </div>

          <div class="border-t pt-4 space-y-1" style="border-color: var(--border);">
            <h4 class="text-[11px] font-bold tracking-wider font-mono uppercase text-slate-400">
              LOCATION & TRAFFIC / 地理與交通機能描述
            </h4>
            <div v-if="note.ai_analysis" class="mt-1">
              <textarea v-model="note.ai_analysis.traffic_info" @input="handleFieldChange" rows="2"
                class="inline-textarea w-full text-xs leading-relaxed" placeholder="暫無交通便利度分析數據。"></textarea>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
  <div v-else class="text-center py-12 font-mono text-xs opacity-50">
    RETRIEVING SPECIFIC RECORD DATA / 正在檢索特定房源數據...
  </div>
</template>