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

  /**
   * 2026年農曆轉國曆對照表（農曆月份對應的國曆日期範圍）
   * 資料來源：2026年農曆年曆
   */
  const LUNAR_TO_SOLAR_2026 = {
    // 農曆正月（2026年2月8日 - 2026年3月8日）
    "1": { start: "2026-02-08", end: "2026-03-08", startMonth: 2, startDay: 8, endMonth: 3, endDay: 8 },
    // 農曆二月（2026年3月9日 - 2026年4月7日）
    "2": { start: "2026-03-09", end: "2026-04-07", startMonth: 3, startDay: 9, endMonth: 4, endDay: 7 },
    // 農曆三月（2026年4月8日 - 2026年5月7日）
    "3": { start: "2026-04-08", end: "2026-05-07", startMonth: 4, startDay: 8, endMonth: 5, endDay: 7 },
    // 農曆四月（2026年5月8日 - 2026年6月5日）
    "4": { start: "2026-05-08", end: "2026-06-05", startMonth: 5, startDay: 8, endMonth: 6, endDay: 5 },
    // 農曆五月（2026年6月6日 - 2026年7月5日）
    "5": { start: "2026-06-06", end: "2026-07-05", startMonth: 6, startDay: 6, endMonth: 7, endDay: 5 },
    // 農曆六月（2026年7月6日 - 2026年8月3日）
    "6": { start: "2026-07-06", end: "2026-08-03", startMonth: 7, startDay: 6, endMonth: 8, endDay: 3 },
    // 農曆七月（2026年8月4日 - 2026年9月2日）
    "7": { start: "2026-08-04", end: "2026-09-02", startMonth: 8, startDay: 4, endMonth: 9, endDay: 2 },
    // 農曆八月（2026年9月3日 - 2026年10月1日）
    "8": { start: "2026-09-03", end: "2026-10-01", startMonth: 9, startDay: 3, endMonth: 10, endDay: 1 },
    // 農曆九月（2026年10月2日 - 2026年10月31日）
    "9": { start: "2026-10-02", end: "2026-10-31", startMonth: 10, startDay: 2, endMonth: 10, endDay: 31 },
    // 農曆十月（2026年11月1日 - 2026年11月29日）
    "10": { start: "2026-11-01", end: "2026-11-29", startMonth: 11, startDay: 1, endMonth: 11, endDay: 29 },
    // 農曆十一月（2026年11月30日 - 2026年12月29日）
    "11": { start: "2026-11-30", end: "2026-12-29", startMonth: 11, startDay: 30, endMonth: 12, endDay: 29 },
    // 農曆十二月（2026年12月30日 - 2027年1月28日）
    "12": { start: "2026-12-30", end: "2027-01-28", startMonth: 12, startDay: 30, endMonth: 1, endDay: 28 },
  };

  /**
   * 將農曆日期範圍轉換為國曆日期範圍
   * @param {string} lunarRange 農曆日期範圍（如 "2/4-3/5"）
   * @param {number} lunarMonth 農曆月份（1-12）
   * @returns {Object|null} { solarStart: "2/8", solarEnd: "3/8", fullRange: "2/8-3/8" } 或 null
   */
  function convertLunarToSolar(lunarRange, lunarMonth) {
    if (!lunarRange || !lunarMonth) return null;
    
    const monthKey = String(lunarMonth);
    const solarInfo = LUNAR_TO_SOLAR_2026[monthKey];
    
    if (!solarInfo) return null;
    
    // 提取農曆範圍中的具體日期（如果有的話）
    const lunarMatch = String(lunarRange).match(/(\d{1,2})\/(\d{1,2})[~-](\d{1,2})\/(\d{1,2})/);
    
    if (lunarMatch) {
      const startLunarMonth = parseInt(lunarMatch[1], 10);
      const startLunarDay = parseInt(lunarMatch[2], 10);
      const endLunarMonth = parseInt(lunarMatch[3], 10);
      const endLunarDay = parseInt(lunarMatch[4], 10);
      
      // 如果範圍跨月，使用兩個月的國曆範圍
      if (startLunarMonth !== endLunarMonth) {
        const startSolarInfo = LUNAR_TO_SOLAR_2026[String(startLunarMonth)];
        const endSolarInfo = LUNAR_TO_SOLAR_2026[String(endLunarMonth)];
        if (startSolarInfo && endSolarInfo) {
          return {
            solarStart: `${startSolarInfo.startMonth}/${startSolarInfo.startDay}`,
            solarEnd: `${endSolarInfo.endMonth}/${endSolarInfo.endDay}`,
            fullRange: `${startSolarInfo.startMonth}/${startSolarInfo.startDay}-${endSolarInfo.endMonth}/${endSolarInfo.endDay}`,
            isCrossMonth: true
          };
        }
      }
    }
    
    // 使用整月的國曆範圍
    return {
      solarStart: `${solarInfo.startMonth}/${solarInfo.startDay}`,
      solarEnd: `${solarInfo.endMonth}/${solarInfo.endDay}`,
      fullRange: `${solarInfo.startMonth}/${solarInfo.startDay}-${solarInfo.endMonth}/${solarInfo.endDay}`,
      isCrossMonth: false
    };
  }

  // 導出到 window.Utils
  if (typeof window !== "undefined") {
    window.Utils = {
      escHtml,
      parseMonthFromRange,
      clamp,
      roundTo,
      pad2,
      convertLunarToSolar,
      LUNAR_TO_SOLAR_2026,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.Utils = {
      escHtml,
      parseMonthFromRange,
      clamp,
      roundTo,
      pad2,
      convertLunarToSolar,
      LUNAR_TO_SOLAR_2026,
    };
  }
})();
