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
    const hostname = typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname : "";
    const port = typeof window !== "undefined" && window.location && window.location.port ? window.location.port : "";
    
    // 如果本地服務器不支持 POST，改用 GET（向後兼容）
    // 檢測 localhost、127.0.0.1 或端口 8081/8080
    const isLocalhost = hostname === "localhost" || 
                        hostname === "127.0.0.1" || 
                        base.includes("localhost") || 
                        base.includes("127.0.0.1");
    const isDevPort = port === "8081" || port === "8080" || base.includes(":8081") || base.includes(":8080");
    const useGet = isLocalhost || isDevPort;
    
    // 調試日誌（僅在開發環境）
    if (useGet && console && console.log) {
      console.log("[strategyConfig] 檢測到本地環境，使用 GET 請求", { hostname, port, base });
    }
    
    if (useGet) {
      // 本地開發環境：使用 GET 請求（避免 501 錯誤）
      const params = new URLSearchParams({
        palace: palace || "",
        strength: String(strength || 1),
        sihuaList: (sihuaList || []).join(",")
      });
      return fetch(base + "/api/strategy-note?" + params.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((r) => {
          if (!r.ok && r.status !== 404) {
            // 如果不是 404，記錄警告但繼續
            console.warn(`[strategyConfig] GET /api/strategy-note 返回 ${r.status}`);
          }
          if (r.status === 404 || !r.ok) {
            // 如果 API 不存在，返回默認值
            return Promise.resolve({ note: "（暫無戰略提示）" });
          }
          return r.json();
        })
        .then((data) => (data && data.note != null ? data.note : "（暫無戰略提示）"))
        .catch((err) => {
          console.warn("[strategyConfig] 獲取戰略提示失敗:", err);
          return "（暫無戰略提示）";
        });
    } else {
      // 生產環境：使用 POST 請求
      return fetch(base + "/api/strategy-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palace, strength, sihuaList: sihuaList || [] }),
      })
        .then((r) => {
          if (!r.ok) {
            console.warn(`[strategyConfig] POST /api/strategy-note 返回 ${r.status}`);
            return Promise.resolve({ note: "（暫無戰略提示）" });
          }
          return r.json();
        })
        .then((data) => (data && data.note != null ? data.note : "（暫無戰略提示）"))
        .catch((err) => {
          console.warn("[strategyConfig] 獲取戰略提示失敗:", err);
          return "（暫無戰略提示）";
        });
    }
  }

  const StrategyConfig = {
    scoreToStrength,
    getStrategyNoteFromAPI,
  };

  if (typeof global !== "undefined") {
    global.StrategyConfig = StrategyConfig;
  }
})(typeof window !== "undefined" ? window : globalThis);
