/* config.js
 * 配置常量庫
 * 集中管理顏色映射、狀態標籤等配置
 */

(function () {
  "use strict";

  /**
   * 狀態標籤映射表（根據內部等級 1-5）
   */
  const STATUS_LABELS = {
    5: "極佳",
    4: "強勁",
    3: "平穩",
    2: "穩健",
    1: "基礎"
  };

  /**
   * 顏色代碼映射表（根據內部等級 1-5）
   * 五級分級對應五種顏色，更精確地反映能量狀態
   */
  const COLOR_CODES = {
    5: "emerald",  // 極佳：翠綠色（4.5星）
    4: "green",    // 強勁：綠色（4.0星）
    3: "amber",    // 平穩：琥珀色（3.5星）
    2: "orange",   // 穩健：橙色（3.0星）
    1: "slate"     // 基礎：灰藍色（2.5星）
  };

  /**
   * RGB 顏色映射表（用於能量條）
   */
  const RGB_COLORS = {
    "emerald": "rgb(16, 185, 129)",  // 翠綠色（4.5星）
    "green": "rgb(34, 197, 94)",     // 綠色（4.0星）
    "amber": "rgb(251, 191, 36)",    // 琥珀色（3.5星）
    "orange": "rgb(249, 115, 22)",   // 橙色（3.0星）
    "slate": "rgb(100, 116, 139)",   // 灰藍色（2.5星）
    // 預設顏色
    "default": "rgb(251, 191, 36)"   // 預設琥珀色
  };

  /**
   * Tailwind CSS 邊框顏色類映射表
   */
  const BORDER_COLOR_CLASSES = {
    "emerald": "border-emerald-400/40",
    "green": "border-green-400/40",
    "amber": "border-amber-400/40",
    "orange": "border-orange-400/40",
    "slate": "border-slate-400/40",
    "default": "border-amber-400/40"
  };

  /**
   * Tailwind CSS 背景顏色類映射表
   */
  const BG_COLOR_CLASSES = {
    "emerald": "bg-emerald-500/10",
    "green": "bg-green-500/10",
    "amber": "bg-amber-500/10",
    "orange": "bg-orange-500/10",
    "slate": "bg-slate-500/10",
    "default": "bg-amber-500/10"
  };

  /**
   * 文字顏色類映射表（用於標籤）
   */
  const TEXT_COLOR_CLASSES = {
    "emerald": "text-emerald-300",
    "green": "text-green-300",
    "amber": "text-amber-300",
    "orange": "text-orange-300",
    "slate": "text-slate-300",
    "red": "text-red-300",
    "default": "text-amber-300"
  };

  /**
   * 根據顏色代碼獲取 RGB 顏色
   * @param {string} colorCode 顏色代碼
   * @returns {string} RGB 顏色字串
   */
  function getRgbColor(colorCode) {
    return RGB_COLORS[colorCode] || RGB_COLORS.default;
  }

  /**
   * 根據顏色代碼獲取邊框顏色類
   * @param {string} colorCode 顏色代碼
   * @returns {string} Tailwind CSS 類名
   */
  function getBorderColorClass(colorCode) {
    return BORDER_COLOR_CLASSES[colorCode] || BORDER_COLOR_CLASSES.default;
  }

  /**
   * 根據顏色代碼獲取背景顏色類
   * @param {string} colorCode 顏色代碼
   * @returns {string} Tailwind CSS 類名
   */
  function getBgColorClass(colorCode) {
    return BG_COLOR_CLASSES[colorCode] || BG_COLOR_CLASSES.default;
  }

  /**
   * 根據顏色代碼獲取文字顏色類
   * @param {string} colorCode 顏色代碼
   * @returns {string} Tailwind CSS 類名
   */
  function getTextColorClass(colorCode) {
    return TEXT_COLOR_CLASSES[colorCode] || TEXT_COLOR_CLASSES.default;
  }

  // 導出到 window.Config
  if (typeof window !== "undefined") {
    window.Config = {
      STATUS_LABELS,
      COLOR_CODES,
      RGB_COLORS,
      BORDER_COLOR_CLASSES,
      BG_COLOR_CLASSES,
      TEXT_COLOR_CLASSES,
      getRgbColor,
      getBorderColorClass,
      getBgColorClass,
      getTextColorClass,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.Config = {
      STATUS_LABELS,
      COLOR_CODES,
      RGB_COLORS,
      BORDER_COLOR_CLASSES,
      BG_COLOR_CLASSES,
      TEXT_COLOR_CLASSES,
      getRgbColor,
      getBorderColorClass,
      getBgColorClass,
      getTextColorClass,
    };
  }
})();
