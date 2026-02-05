/* strategy-tags.js
 * 策略标签工具模块
 * 导出到 window.UiUtils.StrategyTags
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 流月戰略標籤：隱藏十神術語，改以戰略標籤
   * @param {Object} b - 流月数据对象
   * @param {number} b.riskScore - 风险分数
   * @param {string} b.light - 风险等级（如 "RED"）
   * @param {string[]} b.reasonTags - 原因标签数组
   * @returns {string} 策略标签文本
   */
  function getMonthStrategyTag(b) {
    const risk = Number(b.riskScore) || 0;
    const isHigh = risk >= 55 || b.light === "RED";
    const reasons = (b.reasonTags || []).join("");
    const hasCai = /財|才|偏財|正財/.test(reasons);
    const hasGuanSha = /官|殺|七殺|正官|偏官/.test(reasons);
    if (isHigh && (hasGuanSha || risk >= 70)) return "🚨 壓力監測";
    if (!isHigh && hasCai) return "💰 資源收割";
    if (!isHigh) return "🟢 穩進";
    return "🟡 節奏調整";
  }

  // 导出到 window.UiUtils.StrategyTags
  if (!window.UiUtils) {
    window.UiUtils = {};
  }

  window.UiUtils.StrategyTags = {
    getMonthStrategyTag,
  };
})();
