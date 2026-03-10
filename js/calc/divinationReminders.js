/**
 * divinationReminders.js
 * 占卦預警與追蹤提醒文案（#深度貼文 風格）
 * 供結果頁即時顯示、未來推播邏輯使用
 */
(function (global) {
  "use strict";

  /**
   * 依 timePeriod 將爻索引 (1-6) 轉為時間標籤
   */
  function formatMonthLabel(month, timePeriod) {
    const MONTHS_1YEAR = [2, 4, 6, 8, 10, 12];
    const STAGES = ["起步", "開始有聲譽", "多變動", "戒慎恐懼", "如日中天", "逐步引退或局外觀察"];
    switch (timePeriod) {
      case "1year": return (MONTHS_1YEAR[month - 1] || month) + "月";
      case "6years": return "第 " + month + " 年";
      case "stages": return STAGES[month - 1] || "階段" + month;
      default: return "第 " + month + " 月";
    }
  }

  /**
   * 取得負分月份的預警文案
   * @param {number} month - 爻位置 1-6
   * @param {number} score - 該月分數
   * @param {string} hint - 爻辭白話（如「濡其首」「亢龍有悔」）
   * @param {boolean} isChanging - 是否為動爻月
   * @param {string} [timePeriod] - 6months | 1year | 6years | stages
   * @returns {{ title: string, body: string, cta: string }}
   */
  function getNegativeMonthAlert(month, score, hint, isChanging, timePeriod) {
    const label = formatMonthLabel(month, timePeriod || "6months");
    const hintKey = (hint || "").split("：")[0] || "此爻";
    const templates = {
      default: {
        title: label + "：轉折在即",
        body: "卦象顯示，" + label + "將進入「" + hintKey + "」的轉折期。這不是壞事——易經提醒我們：物極必反之前，正是調整步伐的黃金時刻。減少擴張、收斂鋒芒、把資源留在真正重要的事上。在丙午火年，懂得何時煞車的人，往往走得最遠。",
        cta: "回顧我的卦象",
      },
      month6: {
        title: (timePeriod === "1year" ? "12月" : timePeriod === "6years" ? "第 6 年" : "半年") + "將盡：最後一哩路的智慧",
        body: "上爻往往代表「物極必反」的臨界點。卦象中的「" + hintKey + "」提醒你：成功在望時，最忌過度沉溺或輕敵。這不是要你停下來，而是請你帶著警覺走完最後一哩。在火旺之年，保持清醒比保持衝勁更重要。",
        cta: "查看完整解析",
      },
      changing: {
        title: label + " ★ 動爻月：關鍵轉折",
        body: "這是你的動爻月——事情將在此發生實質轉折。「" + hintKey + "」不只是爻辭，而是當下的行動指南。卦象在提醒：此刻的選擇，會直接影響後續發展。放慢腳步、傾聽直覺、做出與內心一致的决定。",
        cta: "再看一次動爻解析",
      },
    };

    let t = templates.default;
    if (month === 6) t = templates.month6;
    else if (isChanging) t = templates.changing;

    return { title: t.title, body: t.body, cta: t.cta };
  }

  /**
   * 取得動爻月結束後的進度反饋提示（供未來推播使用）
   * @param {number} month - 剛結束的月份
   * @param {string} hint - 該月爻辭白話
   */
  function getProgressFeedbackPrompt(month, hint) {
    const hintKey = (hint || "").split("：")[0] || "當時的提醒";
    return {
      title: "第 " + month + " 月過去了",
      body: "還記得卦象中的「" + hintKey + "」嗎？上個月的經歷，有沒有呼應這個提醒？你的反饋會幫助我們優化未來的解釋——無論是「超準」還是「不太一樣」，都值得記錄。",
      cta: "分享我的感受",
    };
  }

  /**
   * 掃描趨勢，回傳需預警的月份
   * @param {Array<{ month: number, score: number, hint: string, isChanging: boolean }>} months
   * @param {number} threshold - 低於此分數即預警，預設 0
   * @param {string} [timePeriod] - 6months | 1year | 6years | stages
   */
  function getAlertsForMonths(months, threshold, timePeriod) {
    threshold = threshold ?? 0;
    const alerts = [];
    for (let i = 0; i < (months || []).length; i++) {
      const m = months[i];
      if (m.score < threshold) {
        alerts.push({
          month: m.month,
          score: m.score,
          ...getNegativeMonthAlert(m.month, m.score, m.hint, m.isChanging, timePeriod),
        });
      }
    }
    return alerts;
  }

  const api = {
    getNegativeMonthAlert,
    getProgressFeedbackPrompt,
    getAlertsForMonths,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DivinationReminders = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
