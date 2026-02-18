/**
 * divinationScore.js
 * 384爻加權運算：當位、應與、流年、動爻
 * Score = (base + correct + resonance) × yearWeight
 * 動爻月量級加倍，並觸發變卦解釋
 */
(function (global) {
  "use strict";

  const YEAR_WEIGHT = {
    金: 0.8,
    木: 0.9,
    水: 1.0,
    火: 1.2,
    土: 1.3,
  };

  let lines384 = null;
  let palaceData = null;

  function loadLines384() {
    if (lines384) return Promise.resolve(lines384);
    return fetch("data/iching/lines-384.json")
      .then((r) => r.json())
      .then((d) => {
        lines384 = d;
        return d;
      });
  }

  function loadPalace() {
    if (palaceData) return Promise.resolve(palaceData);
    return fetch("data/iching/hexagram-palace.json")
      .then((r) => r.json())
      .then((d) => {
        palaceData = d;
        return d;
      });
  }

  function getYearWeight(wuxing) {
    return YEAR_WEIGHT[wuxing] ?? 1.0;
  }

  /**
   * 計算六個月運勢分數與動爻月提示
   * @param {number} primaryIndex - 本卦 King Wen 序 1-64
   * @param {number[]} changingLines - 動爻索引 [0-5]
   * @param {string} palaceWuxing - 卦宮五行 金木水火土
   * @returns {{ months: Array<{ month: number, score: number, isChanging: boolean, hint: string }>, totalTrend: string }}
   */
  function computeMonthlyScores(primaryIndex, changingLines, palaceWuxing) {
    const data = lines384?.lines?.[String(primaryIndex)];
    if (!data) return { months: [], totalTrend: "" };

    const yearWeight = getYearWeight(palaceWuxing);
    const changingSet = new Set(changingLines || []);
    const months = [];
    let sum = 0;

    for (let i = 0; i < 6; i++) {
      const line = data[i];
      if (!line) continue;
      const raw = line.base + line.correct + line.resonance;
      const score = Math.round(raw * yearWeight);
      const isChanging = changingSet.has(i);
      const mag = isChanging ? line.mag * 2 : line.mag;
      sum += score;
      months.push({
        month: i + 1,
        score,
        mag,
        isChanging,
        hint: line.hint || "",
      });
    }

    const avg = months.length ? sum / months.length : 0;
    let totalTrend = "平";
    if (avg > 15) totalTrend = "吉";
    else if (avg > 5) totalTrend = "小吉";
    else if (avg < -15) totalTrend = "凶";
    else if (avg < -5) totalTrend = "小凶";

    return { months, totalTrend };
  }

  /**
   * 取得動爻的深度解釋（供結果頁使用）
   * @returns {Array<{ name: string, text: string, hint: string }>}
   *   text: 完整爻辭（來自 hexagrams.json）
   *   hint: 白話建議（節錄+解讀）
   */
  function getChangingLineHints(primaryIndex, changingLines) {
    const data = lines384?.lines?.[String(primaryIndex)];
    if (!data || !changingLines?.length) return [];
    const names = ["初", "二", "三", "四", "五", "上"];
    return changingLines.map((idx) => ({
      name: names[idx] + "爻",
      text: data[idx]?.text || "",
      hint: data[idx]?.hint || "",
    }));
  }

  /**
   * 產生分享文案模板
   */
  function getShareTemplate(primaryName, transformedName, changingHint) {
    const t = new Date();
    const year = t.getFullYear();
    let text = `在 ${year} 丙午火年，我為自己的計畫占了一卦。本卦【${primaryName}】、變卦【${transformedName}】。`;
    if (changingHint) {
      text += ` ${changingHint} `;
    }
    text += "在火旺之年，靜下心來思考基礎是否穩固，比盲目衝刺更重要。\n\n#人生說明書 #易經學習占卦 #丙午流年";
    return text;
  }

  function getLines384() {
    return lines384;
  }

  const api = {
    loadLines384,
    getLines384,
    loadPalace,
    getYearWeight,
    computeMonthlyScores,
    getChangingLineHints,
    getShareTemplate,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DivinationScore = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
