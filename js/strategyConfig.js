/**
 * 伯彥戰略庫 (Strategy Library) - 前端輕量版
 * 僅保留 scoreToStrength（分數→等級映射），金句矩陣與拼接邏輯在後端。
 * 戰略一句話由 POST /api/strategy-note 取得，前端不得存放完整文案。
 */
(function (global) {
  "use strict";

  /**
   * 將分數 (0~max) 映射為強度等級 1~4（純公式，非敏感資料）
   */
  function scoreToStrength(score, maxScore) {
    if (!maxScore || maxScore <= 0) return 1;
    const r = score / maxScore;
    if (r >= 0.85) return 4;
    if (r >= 0.55) return 3;
    if (r >= 0.25) return 2;
    return 1;
  }

  /**
   * 向後端取得戰略一句話（金句僅存於後端）
   * @param {string} palace
   * @param {1|2|3|4} strength
   * @param {string[]} sihuaList
   * @returns {Promise<string>}
   */
  function getStrategyNoteFromAPI(palace, strength, sihuaList) {
    const base = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "";
    return fetch(base + "/api/strategy-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palace, strength, sihuaList: sihuaList || [] }),
    })
      .then((r) => r.json())
      .then((data) => (data && data.note != null ? data.note : "（暫無戰略提示）"))
      .catch(() => "（暫無戰略提示）");
  }

  const StrategyConfig = {
    scoreToStrength,
    getStrategyNoteFromAPI,
  };

  if (typeof global !== "undefined") {
    global.StrategyConfig = StrategyConfig;
  }
})(typeof window !== "undefined" ? window : globalThis);
