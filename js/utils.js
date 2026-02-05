/* utils.js
 * 通用工具函數庫
 * 提取重複代碼，統一輔助函數
 */

(function () {
  "use strict";

  /**
   * HTML 轉義函數
   * @param {string|number|null|undefined} str 要轉義的字串
   * @returns {string} 轉義後的字串
   */
  function escHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * 從月份範圍字串解析月份編號
   * @param {string} range 月份範圍字串（如 "1/1-1/31", "1.1-1.31", "2026-02-01~2026-02-28"）
   * @returns {number} 月份編號（1-12），解析失敗返回 0
   */
  function parseMonthFromRange(range) {
    if (!range) return 0;
    const s = String(range).trim();
    
    // 匹配格式：2026-02-01~2026-02-28（ISO 日期格式）
    const isoMatch = s.match(/(?:^|\D)(\d{4})-(\d{1,2})-\d{1,2}/);
    if (isoMatch && isoMatch[2]) {
      const month = parseInt(isoMatch[2], 10);
      if (month >= 1 && month <= 12) return month;
    }
    
    // 匹配格式：1/1, 01/1, 1-1, 01-1 等（開頭為月份）
    const m1 = s.match(/^(\d{1,2})[/.-]/);
    if (m1) {
      const month = parseInt(m1[1], 10);
      if (month >= 1 && month <= 12) return month;
    }
    
    // 匹配格式：1., 01. 等
    const m2 = s.match(/^0?(\d)\./);
    if (m2) {
      const month = parseInt(m2[1], 10);
      if (month >= 1 && month <= 12) return month;
    }
    
    // 匹配格式：任何位置出現的 "M月" 或 "M/" 或 "M-"
    const m3 = s.match(/(?:^|\D)(\d{1,2})[/-]/);
    if (m3) {
      const month = parseInt(m3[1], 10);
      if (month >= 1 && month <= 12) return month;
    }
    
    return 0;
  }

  /**
   * 將數字限制在指定範圍內
   * @param {number} value 要限制的值
   * @param {number} min 最小值
   * @param {number} max 最大值
   * @returns {number} 限制後的值
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 格式化數字為指定小數位數
   * @param {number} num 要格式化的數字
   * @param {number} decimals 小數位數（預設 1）
   * @returns {number} 格式化後的數字
   */
  function roundTo(num, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }

  /**
   * 補零函數（兩位數）
   * @param {number|string} n 要補零的數字
   * @returns {string} 補零後的字串
   */
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // 導出到 window.Utils
  if (typeof window !== "undefined") {
    window.Utils = {
      escHtml,
      parseMonthFromRange,
      clamp,
      roundTo,
      pad2,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.Utils = {
      escHtml,
      parseMonthFromRange,
      clamp,
      roundTo,
      pad2,
    };
  }
})();
