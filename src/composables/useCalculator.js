import { ref } from 'vue'

// 全站單一實例 (Singleton) - 僅精算機或全域設定使用
const monthlyIncome = ref(45000)
const identityType = ref('none')

export function useCalculator() {

    /**
     * 全台灣通用：中央租金補貼模糊辨識系統 (基礎版，不綁定全域狀態)
     */
    const getBaseSubsidyAmount = (address = '') => {
        const addr = address ? address.trim() : ''
        let baseAmount = 2000
        let detectedCity = '其餘縣市 / 離島地區（第三級區域）'

        // 1. 臺北市 (3,000元)
        const isTaipei = /台北|臺北/.test(addr)

        // 2. 新北核心區 / 桃園 / 台中核心區 / 新竹縣市 (2,400元)
        const isLevel2400 = /桃園|新竹|竹北|竹東/.test(addr) ||
            (/新北/.test(addr) && /板橋|新莊|中和|永和|三重|蘆洲|土城|汐止|樹林|新店|三峽|鶯歌|五股|泰山|林口|深坑|淡水|八里/.test(addr)) ||
            (/台中|臺中/.test(addr) && /中區|北區|北屯|西區|西屯|東區|南區|南屯|大里|大雅|潭子|龍井|豐原|大甲|太平|沙鹿|烏日/.test(addr))

        // 3. 台南核心區 / 高雄核心區 (2,200元)
        const isLevel2200 = /台南|臺南|高雄/.test(addr)

        if (isTaipei) {
            baseAmount = 3000
            detectedCity = '臺北市（第一級區域）'
        }
        else if (isLevel2400) {
            baseAmount = 2400
            detectedCity = '新北核心 / 桃園 / 台中核心 / 新竹（第二級區域）'
        }
        else if (isLevel2200) {
            baseAmount = 2200
            detectedCity = '臺南核心 / 高雄核心（第二級區域）'
        }
        // 其餘沒進 if 的，就是最下面的其餘縣市、新北台中台南高雄的偏鄉蛋白區，通通回傳預設的 2000 元

        return { baseAmount, detectedCity }
    }

    const calculateSubsidy = (address = '') => {
        const { baseAmount, detectedCity } = getBaseSubsidyAmount(address)
        let multiplier = 1.0;

        switch (identityType.value) {
            case 'single':
                multiplier = 1.2;
                break;
            case 'newlywed':
                multiplier = 1.3;
                break;
            case 'social_disadvantage': // 社會弱勢
                multiplier = 1.2;
                break;
            case 'economic_disadvantage': // 經濟弱勢
                multiplier = 1.4;
                break;
            case 'raised_child':
                multiplier = 1.4;
                break;
            default:
                multiplier = 1.0;
        }

        return {
            amount: Math.floor(baseAmount * multiplier),
            detectedCity
        }
    }

    /**
     * 🌟 修正：純粹比對 租金/管理費/水電 與 交通距離 關係的客觀評估公式
     */
    const evaluateNotePurely = (note, extraOpts = {}) => {
        if (!note) return null

        const rent = Number(note.rent) || 0
        const managementFee = Number(note.management_fee) || 0
        const estimatedUtility = Number(extraOpts.estimatedUtility) || 0
        const sharePeople = Math.max(1, Number(extraOpts.sharePeople) || 1)

        // 1. 計算單人實際總開銷（真實淨流出基礎）
        const closest_station_minutes = Number(note.closest_station_minutes)
        const personalRentAndFee = Math.floor((rent + managementFee) / sharePeople)
        const personalUtility = Math.floor(estimatedUtility / sharePeople)
        const finalRealCost = personalRentAndFee + personalUtility

        // 2. 核心性價比（CP值）評分邏輯 (滿分 100，從 80 分平衡點開始增減)
        let score = 80

        // ─── 象限一：開銷與市場基準關係 ───
        // 以台灣主流單人套房客觀市場租金極限約 13,000 元為基準線
        if (finalRealCost > 13000) {
            const excess = finalRealCost - 13000
            // 每超出市場常態 1,000 元，扣 4 分（高價負擔懲罰）
            score -= Math.floor(excess / 1000) * 4
        } else if (finalRealCost <= 9000 && finalRealCost > 0) {
            // 總預算低於 9,000 元，屬於市場親民價，加 5 分
            score += 5
        }

        // ─── 象限二：交通距離與租金的對等關係 ───
        if (closest_station_minutes > 0 && closest_station_minutes <= 5) {
            // 捷運黃金 5 分鐘內：極大優勢
            score += 12
            // 補償機制：如果交通極方便，高租金的懲罰可以減緩（用金錢換時間合理化）
            if (finalRealCost > 15000) score += 5
        }
        else if (closest_station_minutes > 5 && closest_station_minutes <= 15) {
            // 15 分鐘內標準通勤圈
            score += 5
        }
        else if (closest_station_minutes > 15 && closest_station_minutes <= 30) {
            // 稍遠但可接受
            score -= 5
        }
        else if (closest_station_minutes > 30) {
            // 嚴重扣分項：交通時間過長
            score -= 15
            // 如果交通又遠、總開銷還超過 13,000 元，加重扣分（典型的沒性價比）
            if (finalRealCost > 13000) score -= 10
        }

        // ─── 象限三：客觀政策加成 ───
        // 是否允許租補代表房東的守法度與房源競爭力，不綁定個人身分，純看房源特質
        if (note.allow_subsidy === false) {
            score -= 10
        } else {
            score += 3
        }

        // 限制評分邊界
        score = Math.max(0, Math.min(100, score))

        // ─── 轉換客觀等級 ───
        let level = 'C (性價比低，需審慎考慮)'
        let levelColor = 'text-red-500 dark:text-red-400'

        if (score >= 85) {
            level = 'A (高 CP 值，機能與價格平衡極佳)'
            levelColor = 'text-emerald-500 dark:text-emerald-400'
        } else if (score >= 70) {
            level = 'B (符合行情，表現中規中矩)'
            levelColor = 'text-blue-500 dark:text-blue-400'
        }

        const { detectedCity } = getBaseSubsidyAmount(note.address)

        return {
            score,
            level,
            levelColor,
            detectedCity,
            finalRealCost,
            personalRentAndFee,
            personalUtility
        }
    }

    /**
     * 核心房源評估公式 (保留給精算機頁面使用)
     */
    const evaluateHouse = (note, extraOpts = {}) => {
        // ... 保持你原本的精算機邏輯不變 ...
        if (!note) return null
        const isAllowSubsidy = note.allow_subsidy !== false
        const sharePeople = Math.max(1, Number(extraOpts.sharePeople) || 1)
        const rent = Number(note.rent) || 0
        const managementFee = Number(note.management_fee) || 0
        const estimatedUtility = Number(extraOpts.estimatedUtility) || 0
        const closest_station_minutes = Number(extraOpts.closest_station_minutes) || 0

        const { amount: singleSubsidyAmount, detectedCity } = calculateSubsidy(note.address)
        const personalRentAndFee = Math.floor((rent + managementFee) / sharePeople)
        const personalUtility = Math.floor(estimatedUtility / sharePeople)

        const totalSharedCost = rent + managementFee + estimatedUtility
        const mySharedPart = totalSharedCost / sharePeople

        const hasUserSubsidy = isAllowSubsidy && (Number(extraOpts.subsidyPeople) > 0)
        const mySubsidy = hasUserSubsidy ? singleSubsidyAmount : 0

        const finalRealCostCalculated = mySharedPart - mySubsidy
        const finalRealCost = finalRealCostCalculated > 0 ? Math.floor(finalRealCostCalculated) : 0

        let score = 100
        const personalCommitment = (rent + managementFee) / sharePeople
        const safeIncome = Number(monthlyIncome.value) || 1
        const incomeThird = safeIncome / 3

        if (personalCommitment > incomeThird) {
            const excessRatio = (personalCommitment - incomeThird) / safeIncome
            score -= Math.floor(excessRatio * 100 * 3)
        } else {
            score += 5
        }

        if (closest_station_minutes > 45) score -= 20
        else if (closest_station_minutes > 30) score -= 10
        else if (closest_station_minutes > 0 && closest_station_minutes <= 15) score += 5

        if (note.ai_analysis?.cons?.length) {
            score -= (note.ai_analysis.cons.length * 3)
        }

        if (!isAllowSubsidy) score -= 15

        score = Math.max(0, Math.min(100, score))

        let level = 'C (不推薦，負擔較重)'
        let levelColor = 'text-red-500 dark:text-red-400'
        if (score >= 85) {
            level = 'A+ (神房！閉眼衝)'
            levelColor = 'text-emerald-500 dark:text-emerald-400'
        } else if (score >= 70) {
            level = 'B (高CP值，合適選擇)'
            levelColor = 'text-blue-500 dark:text-blue-400'
        }

        return {
            score,
            level,
            levelColor,
            subsidy: mySubsidy,
            isAllowSubsidy,
            detectedCity,
            finalRealCost,
            personalRentAndFee,
            personalUtility,
            financialRatio: ((personalCommitment / safeIncome) * 100).toFixed(1)
        }
    }

    return {
        monthlyIncome,
        identityType,
        calculateSubsidy,
        evaluateHouse,
        evaluateNotePurely
    }
}