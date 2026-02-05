/* api-service.js
 * API 服务模块
 * 导出到 window.UiServices.ApiService
 * 依赖: window.Calc
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  const API_BASE = "https://17gonplay-api.billeetw.workers.dev";

  /**
   * 加载数据库内容
   * @param {Function} onSuccess - 成功回调，接收 dbContent
   */
  async function loadDbContent(onSuccess) {
    try {
      const r = await fetch(`${API_BASE}/content/2026`, { method: "GET" });
      const j = await r.json();
      if (j?.ok) {
        if (onSuccess) onSuccess(j);
        return j;
      }
      return null;
    } catch (e) {
      console.warn("loadDbContent failed", e);
      return null;
    }
  }

  /**
   * 计算所有数据（八字+紫微+流月+十神）
   * @param {Object} params - 计算参数
   * @param {number} params.year - 出生年
   * @param {number} params.month - 出生月
   * @param {number} params.day - 出生日
   * @param {number} params.hour - 出生时
   * @param {number} params.minute - 出生分
   * @param {string} [params.gender] - 性别 "M" | "F"
   * @returns {Promise<Object>} API 响应数据
   */
  async function computeAll(params) {
    const { year, month, day, hour, minute, gender } = params;
    const baseBody = { year, month, day, hour, minute };
    const bodyWithGender = gender ? { ...baseBody, gender } : baseBody;

    let resp = await fetch(`${API_BASE}/compute/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyWithGender),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      // 若後端不支援 gender 欄位，做一次降級重試（避免整個系統卡死）
      if (gender && resp.status === 400 && /gender|sex/i.test(t)) {
        resp = await fetch(`${API_BASE}/compute/all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });
      } else {
        throw new Error(`API HTTP ${resp.status} ${t}`.trim());
      }
    }

    if (!resp.ok) {
      const t2 = await resp.text().catch(() => "");
      throw new Error(`API HTTP ${resp.status} ${t2}`.trim());
    }

    const payload = await resp.json();
    if (!payload?.ok) {
      throw new Error(payload?.error || "API error");
    }

    return payload;
  }

  /**
   * 获取宫位分数
   * @param {string} chartId - 图表ID
   * @returns {Promise<Object|null>} 宫位分数数据
   */
  async function getPalaceScores(chartId) {
    if (!chartId) {
      console.warn("No chartId provided, scores API 無法呼叫");
      return null;
    }

    try {
      const scoreResp = await fetch(`${API_BASE}/charts/${encodeURIComponent(chartId)}/scores`, {
        method: "GET",
      });
      if (scoreResp.ok) {
        const scores = await scoreResp.json();
        return scores;
      } else {
        console.warn("scores API HTTP", scoreResp.status, await scoreResp.text().catch(() => ""));
        return null;
      }
    } catch (err) {
      console.warn("scores API error:", err);
      return null;
    }
  }

  /**
   * 获取策略笔记
   * @param {string} chartId - 图表ID
   * @param {string} palaceName - 宫位名称
   * @returns {Promise<Object|null>} 策略笔记数据
   */
  async function getStrategyNote(chartId, palaceName) {
    if (!chartId || !palaceName) return null;

    try {
      const resp = await fetch(
        `${API_BASE}/charts/${encodeURIComponent(chartId)}/strategy/${encodeURIComponent(palaceName)}`,
        { method: "GET" }
      );
      if (resp.ok) {
        return await resp.json();
      }
      return null;
    } catch (e) {
      console.warn("getStrategyNote failed", e);
      return null;
    }
  }

  // 导出到 window.UiServices.ApiService
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.ApiService = {
    API_BASE,
    loadDbContent,
    computeAll,
    getPalaceScores,
    getStrategyNote,
  };
})();
