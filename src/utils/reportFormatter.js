// src/utils/reportFormatter.js
export function generateShareText({ houseForm, extraOpts, agentForm, calculationResult, upSellingAdvice }) {
    if (!calculationResult) return ''

    let text = `【租屋財務精算評估報告】\n`
    text += `---------------------------\n`
    text += `房源：${houseForm.title || '未命名物件'}\n`
    text += `位置：${houseForm.address || '未填寫'}\n`
    text += `總純房租：$${houseForm.rent} 元/月\n`
    text += `編制：${extraOpts.sharePeople}人合租 / ${extraOpts.subsidyPeople}人申請租補\n`
    text += `---------------------------\n`
    text += `綜合適合度：${calculationResult.score} / 100\n`
    text += `評級結果：${calculationResult.level || 'N/A'}\n`
    text += `---------------------------\n`
    text += `【個人資金支出明細】\n`
    text += `• 房租+管理費分攤：$${calculationResult.personalRentAndFee} 元\n`
    text += `• 水電分攤+交通費：+$${calculationResult.personalUtilityAndCommute} 元\n`

    if (calculationResult.isAllowSubsidy && extraOpts.subsidyPeople > 0) {
        text += `• 個人專屬中央租補：-$${calculationResult.subsidy || 0} 元\n`
    } else if (!calculationResult.isAllowSubsidy) {
        text += `• 租金補貼狀態：房東拒絕申報\n`
    } else {
        text += `• 租金補貼狀態：未申請\n`
    }

    text += `• 每月實際淨流出：$${calculationResult.finalRealCost} 元/月\n`
    text += `• 租金佔總收入比：${calculationResult.financialRatio}%\n`
    text += `狀態：${Number(calculationResult.financialRatio) > 33.3 ? '⚠️ 固定支出過高，請審慎評估！' : '✅ 財務安全，符合理性資產配置。'}\n`

    if (upSellingAdvice.shouldRecommend) {
        text += `---------------------------\n`
        text += `【UPGRADE STRATEGY 高端車道建議】\n`
        text += `目前物件對您的財務非常輕鬆，您仍有 $${upSellingAdvice.availableMarginPerPerson} 元的安全升級彈性。\n`
        text += `• 個人理想分攤範圍：$${upSellingAdvice.personalMinRent} ~ $${upSellingAdvice.personalMaxRent} 元/人\n`
        text += `• 建議主推房源總價：$${upSellingAdvice.suggestedMinRent} ~ $${upSellingAdvice.suggestedMaxRent} 元/總價\n`
    }

    if (agentForm.name || agentForm.phone || agentForm.lineId || agentForm.instagram) {
        text += `---------------------------\n`
        text += `【服務專員聯絡資訊】\n`
        text += `專員姓名：${agentForm.name || '未填寫'}\n`
        if (agentForm.phone) text += `聯絡電話：${agentForm.phone}\n`
        if (agentForm.lineId) text += `LINE ID：${agentForm.lineId}\n`
        if (agentForm.instagram) text += `IG 帳號：${agentForm.instagram}\n`
    }

    return text
}