import { ref, computed, watch, onMounted } from 'vue'
import { useCalculator } from './useCalculator'

export function useCalculatorView(props, emit) {
    const { monthlyIncome, identityType, evaluateHouse } = useCalculator()

    // ─── 定義初始狀態 ───
    const createInitialState = () => ({
        monthlyIncome: null,
        identityType: 'none',
        houseForm: {
            title: '',
            address: '',
            rent: 12000,
            management_fee: 0,
            allow_subsidy: true,
            closest_station_minutes: 0 // 🌟 1. 移動到 houseForm 內，方便一併控管與快取
        },
        extraOpts: {
            estimatedUtility: 1000,
            sharePeople: 1,
            subsidyPeople: 1
        },
        shareSelectValue: '1',
        subsidySelectValue: '1',
        customSharePeople: 5,
        customSubsidyPeople: 5,
        agentForm: {
            name: '',
            phone: '',
            lineId: '',
            instagram: ''
        }
    })

    const houseForm = ref(createInitialState().houseForm)
    const extraOpts = ref(createInitialState().extraOpts)
    const agentForm = ref(createInitialState().agentForm)

    const shareSelectValue = ref(createInitialState().shareSelectValue)
    const subsidySelectValue = ref(createInitialState().subsidySelectValue)
    const customSharePeople = ref(createInitialState().customSharePeople)
    const customSubsidyPeople = ref(createInitialState().customSubsidyPeople)

    const isCustomShare = computed(() => shareSelectValue.value === 'custom')
    const isCustomSubsidy = computed(() => subsidySelectValue.value === 'custom')

    // ─── 從 localStorage 讀取暫存資料 ───
    const LOCAL_STORAGE_KEY = 'rent_calculator_cache'

    const loadFormDataFromCache = () => {
        try {
            const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (!cachedData) return false

            const parsed = JSON.parse(cachedData)

            monthlyIncome.value = parsed.monthlyIncome !== undefined ? parsed.monthlyIncome : null
            identityType.value = parsed.identityType || 'none'

            if (parsed.houseForm) houseForm.value = { ...houseForm.value, ...parsed.houseForm }
            if (parsed.extraOpts) extraOpts.value = { ...extraOpts.value, ...parsed.extraOpts }
            if (parsed.agentForm) agentForm.value = { ...agentForm.value, ...parsed.agentForm }

            if (parsed.shareSelectValue) shareSelectValue.value = parsed.shareSelectValue
            if (parsed.subsidySelectValue) subsidySelectValue.value = parsed.subsidySelectValue
            if (parsed.customSharePeople) customSharePeople.value = parsed.customSharePeople
            if (parsed.customSubsidyPeople) customSubsidyPeople.value = parsed.customSubsidyPeople

            return true
        } catch (e) {
            console.error('讀取快取失敗:', e)
            return false
        }
    }

    // ─── 監聽資料並寫入快取 ───
    watch(
        [
            monthlyIncome,
            identityType,
            houseForm,
            extraOpts,
            shareSelectValue,
            subsidySelectValue,
            customSharePeople,
            customSubsidyPeople,
            agentForm
        ],
        () => {
            const cachePayload = {
                monthlyIncome: monthlyIncome.value,
                identityType: identityType.value,
                houseForm: houseForm.value,
                extraOpts: extraOpts.value,
                shareSelectValue: shareSelectValue.value,
                subsidySelectValue: subsidySelectValue.value,
                customSharePeople: customSharePeople.value,
                customSubsidyPeople: customSubsidyPeople.value,
                agentForm: agentForm.value
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachePayload))
        },
        { deep: true }
    )

    // ─── 外部導入筆記 ───
    const importNoteData = (noteData) => {
        if (!noteData) return

        houseForm.value.title = noteData.title || noteData.name || ''
        houseForm.value.address = noteData.address || '桃園市中壢區'
        houseForm.value.rent = Number(noteData.rent) || 0
        houseForm.value.management_fee = Number(noteData.management_fee) || Number(noteData.managementFee) || 0

        // 🌟 2. 確實將彈窗選取的點位時間寫入響應式物件
        houseForm.value.closest_station_minutes = Number(noteData.closest_station_minutes) || 0

        if (noteData.allow_subsidy !== undefined) {
            houseForm.value.allow_subsidy = !!noteData.allow_subsidy
        }

        if (noteData.extraOpts) {
            if (noteData.extraOpts.estimatedUtility) extraOpts.value.estimatedUtility = noteData.extraOpts.estimatedUtility

            if (noteData.extraOpts.sharePeople) {
                const sp = noteData.extraOpts.sharePeople
                if ([1, 2, 3, 4].includes(sp)) {
                    shareSelectValue.value = String(sp)
                } else {
                    shareSelectValue.value = 'custom'
                    customSharePeople.value = sp
                }
            }
        }

        emit('data-imported', noteData)
    }

    watch(() => props.initialNoteData, (newVal) => {
        if (newVal) importNoteData(newVal)
    }, { deep: true, immediate: true })

    const resetForm = () => {
        const initialState = createInitialState()
        monthlyIncome.value = initialState.monthlyIncome
        identityType.value = initialState.identityType

        houseForm.value = initialState.houseForm
        extraOpts.value = initialState.extraOpts
        shareSelectValue.value = initialState.shareSelectValue
        subsidySelectValue.value = initialState.subsidySelectValue
        customSharePeople.value = initialState.customSharePeople
        customSubsidyPeople.value = initialState.customSubsidyPeople

        localStorage.removeItem(LOCAL_STORAGE_KEY)
    }

    onMounted(() => {
        if (!props.initialNoteData) {
            const hasCache = loadFormDataFromCache()
            if (!hasCache) {
                resetForm()
            }
        }
    })

    // ─── 人數連動邏輯 ───
    watch([shareSelectValue, customSharePeople], ([selectVal, customNum]) => {
        if (selectVal === 'custom') {
            extraOpts.value.sharePeople = Math.max(1, Number(customNum) || 1)
        } else {
            extraOpts.value.sharePeople = Number(selectVal)
        }
    }, { immediate: true })

    watch([subsidySelectValue, customSubsidyPeople], ([selectVal, customNum]) => {
        if (selectVal === 'custom') {
            extraOpts.value.subsidyPeople = Math.max(0, Number(customNum) || 0)
        } else {
            extraOpts.value.subsidyPeople = Number(selectVal)
        }
    }, { immediate: true })

    watch(() => extraOpts.value.sharePeople, (newSharePeople) => {
        if (extraOpts.value.subsidyPeople > newSharePeople) {
            if (isCustomSubsidy.value) {
                customSubsidyPeople.value = newSharePeople
            } else {
                status => subsidySelectValue.value = String(newSharePeople)
            }
            extraOpts.value.subsidyPeople = newSharePeople
        }
    })

    watch(() => houseForm.value.allow_subsidy, (allow) => {
        if (!allow) {
            subsidySelectValue.value = '0'
            extraOpts.value.subsidyPeople = 0
        }
    })

    // ─── 運算與建議邏輯 ───
    const calculationResult = computed(() => {
        const mockNote = {
            rent: houseForm.value.rent,
            management_fee: houseForm.value.management_fee,
            address: houseForm.value.address,
            allow_subsidy: houseForm.value.allow_subsidy,
            closest_station_minutes: houseForm.value.closest_station_minutes, // 🌟 3. 確保丟進底層計算時有帶上
            ai_analysis: { cons: [] }
        }

        const result = evaluateHouse(mockNote, extraOpts.value)
        if (!result) return null

        return {
            ...result,
            personalRentAndFee: result.personalRentAndFee || 0,
            personalUtility: result.personalUtility || 0
        }
    })

    const upSellingAdvice = computed(() => {
        const score = calculationResult.value?.score || 0
        const income = Number(monthlyIncome.value) || 0
        const currentSharePeople = extraOpts.value.sharePeople || 1

        if (score > 75 && income > 0) {
            const maxPersonalRentBudget = Math.floor(income * 0.333)
            const currentPersonalRent = Math.floor((Number(houseForm.value.rent) || 0) / currentSharePeople)
            const upgradeMarginPerPerson = maxPersonalRentBudget - currentPersonalRent

            if (upgradeMarginPerPerson >= 3000) {
                const personalMinRent = currentPersonalRent + Math.floor(upgradeMarginPerPerson * 0.4)
                const personalMaxRent = maxPersonalRentBudget

                return {
                    shouldRecommend: true,
                    availableMarginPerPerson: upgradeMarginPerPerson,
                    personalMinRent,
                    personalMaxRent,
                    suggestedMinRent: personalMinRent * currentSharePeople,
                    suggestedMaxRent: personalMaxRent * currentSharePeople
                }
            }
        }
        return { shouldRecommend: false }
    })

    // ─── 產生純文字報告 ───
    const shareTextContent = computed(() => {
        const res = calculationResult.value
        const up = upSellingAdvice.value
        if (!res) return ''

        let text = `[租屋財務精算評估報告]\n`
        text += `---------------------------\n`
        text += `房源：${houseForm.value.title || '未命名物件'}\n`
        text += `位置：${houseForm.value.address || '未填寫'}\n`
        text += `總純房租：$${houseForm.value.rent} 元/月\n`
        text += `交通站點：${houseForm.value.closest_station_minutes} 分鐘\n` // 🌟 報告內呈現
        text += `編制：${extraOpts.value.sharePeople}人合租 / ${extraOpts.value.subsidyPeople}人申請租補\n`
        text += `---------------------------\n`
        text += `綜合適合度：${res.score} / 100\n`
        text += `評級結果：${res.level || 'N/A'}\n`
        text += `---------------------------\n`
        text += `[個人資金支出明細]\n`
        text += `- 房租+管理費分攤：$${res.personalRentAndFee} 元\n`
        text += `- 水電預估分攤：+$${res.personalUtility} 元\n`

        if (res.isAllowSubsidy && extraOpts.value.subsidyPeople > 0) {
            text += `- 個人專屬中央租補：-$${res.subsidy || 0} 元\n`
        } else if (!res.isAllowSubsidy) {
            text += `- 租金補貼狀態：房東拒絕申報\n`
        } else {
            text += `- 租金補貼狀態：未申請\n`
        }

        text += `- 每月實際淨流出：$${res.finalRealCost} 元/月\n`
        text += `- 租金佔總收入比：${res.financialRatio}%\n`
        text += `狀態：${Number(res.financialRatio) > 33.3 ? '[警告] 固定支出過高，請審慎評估！' : '[安全] 財務安全，符合理性資產配置。'}\n`

        if (up.shouldRecommend) {
            text += `---------------------------\n`
            text += `[UPGRADE STRATEGY 高端車道建議]\n`
            text += `目前物件對您的財務非常輕鬆，您仍有 $${up.availableMarginPerPerson} 元的安全升級彈性。\n`
            text += `- 個人理想分攤範圍：$${up.personalMinRent} ~ $${up.personalMaxRent} 元/人\n`
            text += `- 建議主推房源總價：$${up.suggestedMinRent} ~ $${up.suggestedMaxRent} 元/總價\n`
        }

        if (agentForm.value.name || agentForm.value.phone || agentForm.value.lineId || agentForm.value.instagram) {
            text += `---------------------------\n`
            text += `[服務專員聯絡資訊]\n`
            text += `專員姓名：${agentForm.value.name || '未填寫'}\n`
            if (agentForm.value.phone) text += `聯絡電話：${agentForm.value.phone}\n`
            if (agentForm.value.lineId) text += `LINE ID：${agentForm.value.lineId}\n`
            if (agentForm.value.instagram) text += `IG 帳號：${agentForm.value.instagram}\n`
        }

        return text
    })

    const shareButtonText = ref('分享財務報告')

    const handleShare = async () => {
        const textToShare = shareTextContent.value
        if (!textToShare) return

        if (navigator.share) {
            try {
                await navigator.share({ text: textToShare })
                return
            } catch (err) {
                console.log('原生分享取消或失敗，切換至複製機制')
            }
        }

        try {
            await navigator.clipboard.writeText(textToShare)
            shareButtonText.value = '已複製報告！前往 LINE'

            setTimeout(() => {
                window.open('https://line.me/R/', '_blank')
                shareButtonText.value = '分享財務報告'
            }, 1200)
        } catch (err) {
            alert('無法自動複製，請手動複製網頁文字進行分享。')
        }
    }

    return {
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
    }
}