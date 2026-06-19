<script setup>
defineProps({
  calculationResult: { type: Object, default: () => null },
  upSellingAdvice: { type: Object, default: () => ({ shouldRecommend: false }) },
  sharePeople: { type: Number, default: 1 },
  subsidyPeople: { type: Number, default: 0 },
  shareButtonText: { type: String, default: '分享財務報告' }
})

defineEmits(['share'])
</script>

<template>
  <div class="md:sticky md:top-20 space-y-4 w-full">
    
    <div class="report-card p-4 sm:p-5 rounded-lg border text-center relative overflow-hidden shadow-sm">
      <div class="absolute top-0 left-0 right-0 h-1" style="background-color: var(--accent);"></div>
      <span class="text-[10px] font-mono tracking-widest opacity-60 uppercase block mb-1 whitespace-nowrap">
        Suitability Score / 綜合適合度
      </span>
      <div class="my-1 sm:my-2 font-mono text-4xl sm:text-5xl font-bold tracking-tight" :class="calculationResult?.levelColor">
        {{ calculationResult?.score }}<span class="text-xs font-sans opacity-60 text-slate-500"> / 100</span>
      </div>
      <div class="inline-block px-3 py-1 rounded text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap" style="background: var(--code-bg); color: var(--text-h);">
        評級結果：<span :class="calculationResult?.levelColor">{{ calculationResult?.level }}</span>
      </div>
      <div class="mt-4 pt-1">
        <button
          @click="$emit('share')"
          class="w-full text-xs font-bold py-2 px-4 rounded transition-all duration-200 shadow-sm border font-mono tracking-wide"
          style="background-color: var(--accent); color: #fff; border-color: var(--accent);"
        >
          {{ shareButtonText }}
        </button>
      </div>
    </div>

    <div 
      v-if="upSellingAdvice.shouldRecommend"
      class="p-4 rounded-lg border text-xs space-y-3 transition-all duration-300 border-amber-500/30"
      style="background-color: rgba(217, 119, 6, 0.05);"
    >
      <div class="flex items-center justify-between border-b pb-1.5 border-amber-500/20 gap-2">
        <span class="font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase whitespace-nowrap overflow-hidden text-ellipsis">
          UPGRADE STRATEGY / 高端車道建議
        </span>
        <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-white font-bold whitespace-nowrap shrink-0">精準空間</span>
      </div>
      <p class="leading-relaxed opacity-90 text-[11px] sm:text-xs">
        當前物件對您的財務基線而言非常輕鬆。以您的收入結構而言，在此合租編制下，您個人每月仍有 
        <span class="font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{{ upSellingAdvice.availableMarginPerPerson }} 元</span> 
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
      <h4 class="text-[11px] sm:text-xs font-bold tracking-wider uppercase border-b pb-2 font-mono flex justify-between items-center gap-2" style="color: var(--text-h); border-color: var(--border);">
        <span class="whitespace-nowrap">Financial Breakdown / 個人資金支出明細</span>
        <span v-if="sharePeople > 1" class="text-[9px] sm:text-[10px] text-amber-600 font-sans font-bold whitespace-nowrap shrink-0">
          (已按 {{ sharePeople }} 人分攤拆解)
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
          <span class="opacity-80 truncate">個人水電分攤 ＋ 個人交通費</span>
          <span class="font-mono font-medium whitespace-nowrap">+ {{ calculationResult?.personalUtilityAndCommute || 0 }} 元</span>
        </div>
        <div class="flex justify-between items-center gap-2 font-medium" :class="calculationResult?.isAllowSubsidy && subsidyPeople > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through opacity-60'">
          <span class="truncate">
            <span v-if="!calculationResult?.isAllowSubsidy">房東拒絕申報租金補貼</span>
            <span v-else-if="subsidyPeople === 0">無人申請租金補貼</span>
            <span v-else class="truncate">個人專屬中央租金補貼</span>
          </span>
          <span class="font-mono whitespace-nowrap">- {{ calculationResult?.subsidy || 0 }} 元</span>
        </div>
        <div class="border-t border-dashed my-2 pt-2.5 flex justify-between items-baseline gap-2" style="border-color: var(--border);">
          <span class="font-bold whitespace-nowrap" style="color: var(--text-h);">
            {{ sharePeople > 1 ? '個人實際每月淨流出' : '每月實際總淨流出' }}
          </span>
          <span class="text-base sm:text-lg font-bold font-mono whitespace-nowrap" style="color: var(--highlight);">
            $ {{ calculationResult?.finalRealCost }} <span class="text-xs font-normal opacity-70">元 / 月</span>
          </span>
        </div>
      </div>
    </div>

    <div class="p-3 sm:p-4 rounded-lg border text-[11px] sm:text-xs space-y-3 shadow-sm transition-colors duration-300">
      <div class="flex items-center justify-between gap-2">
        <span class="opacity-80 leading-normal">
          {{ sharePeople > 1 ? '個人分攤租金佔總收入比重：' : '房租固定支出佔總收入比重：' }}
        </span>
        <span class="font-mono text-xs sm:text-sm font-bold whitespace-nowrap shrink-0" :class="Number(calculationResult?.financialRatio) > 33.3 ? 'text-amber-600 dark:text-[var(--highlight)]' : 'text-emerald-600 dark:text-emerald-400'">
          {{ calculationResult?.financialRatio }} %
        </span>
      </div>
      <p 
        v-if="Number(calculationResult?.financialRatio) > 33.3" 
        class="text-[11px] p-2.5 sm:p-3 rounded-lg border transition-colors duration-300 leading-relaxed"
        style="background-color: var(--highlight-bg); border-color: var(--highlight); color: var(--highlight);"
      >
        [警告] 固定支出已超過您月收入的 1/3（黃金警戒線），將會顯著擠壓日常儲蓄，請審慎評估。
      </p>
      <p 
        v-else 
        class="text-[11px] p-2.5 sm:p-3 rounded-lg border transition-colors duration-300 leading-relaxed text-emerald-700 dark:text-emerald-400"
        style="background-color: var(--accent-bg); border-color: var(--accent-border);"
      >
        [財務安全] 個人房租分攤結構處於安全水位，符合理性資產配置比例。
      </p>
    </div>

  </div>
</template>