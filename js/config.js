/* config.js
 * 配置常量庫
 * 集中管理 API 基底、站點 URL、顏色映射、狀態標籤等配置
 */

(function () {
  "use strict";

  /**
   * API 基底 URL
   * - 8788、8789、3000（wrangler pages dev）：用同源，由 Pages Function 代理到遠端 Worker
   * - www.17gonplay.com（HTTPS 正式站）：同源，避免瀏覽器直連 workers.dev 在部分網路下 Failed to fetch
   * - 5173 等（serve/vite）：直接用遠端 Worker，本地無 Worker 時避免 ERR_CONNECTION_REFUSED
   * - ?api=local 且 port 非 5173：用本地 Worker 8787（需先 cd worker && npx wrangler dev）
   */
  const REMOTE_API_BASE = "https://bazi-api.billeetw.workers.dev";
  const LOCAL_WORKER_API_BASE = "http://127.0.0.1:8787";
  /** 封測模式不內建固定邀請碼；由後端 LIFEBOOK_BETA_CODES 控管 */
  const LIFEBOOK_BETA_PERMANENT_CODE = "";
  /**
   * 命書封測回饋表單基底 URL（Google Form / Typeform）。
   * 優先：`window.LIFEBOOK_FEEDBACK_URL`（在載入本檔前注入）。
   * 次之：下方 `LIFEBOOK_FEEDBACK_URL_INLINE`（可提交於版控）。
   * 皆空則不顯示「封測回饋」連結。
   */
  const LIFEBOOK_FEEDBACK_URL_INLINE = "https://forms.gle/EAsPAy9xJYdCEGPK6";
  const LIFEBOOK_FEEDBACK_URL =
    (typeof window !== "undefined" && String(window.LIFEBOOK_FEEDBACK_URL || "").trim()) ||
    String(LIFEBOOK_FEEDBACK_URL_INLINE || "").trim();
  const port = (typeof window !== "undefined" && window.location.port) || "";
  const usePagesProxy =
    typeof window !== "undefined" &&
    /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) &&
    ["8788", "8789", "3000"].includes(port);
  /** 正式站已部署 functions（compute/content/api/life-book 等代理），與本地 pages dev 一致走同源 */
  const useProductionSameOrigin =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^(www\.)?17gonplay\.com$/i.test(window.location.hostname);
  const useLocalApi =
    typeof window !== "undefined" &&
    /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) &&
    window.location.search.includes("api=local") &&
    !["5173", "5174", "3001"].includes(port);
  const preferLocalWorkerOnLocalhost =
    typeof window !== "undefined" &&
    /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) &&
    !usePagesProxy &&
    !useProductionSameOrigin;
  const API_BASE = useLocalApi
    ? LOCAL_WORKER_API_BASE
    : preferLocalWorkerOnLocalhost
      ? LOCAL_WORKER_API_BASE
    : usePagesProxy || useProductionSameOrigin
      ? (window.location.origin || REMOTE_API_BASE)
      : REMOTE_API_BASE;

  /** bazi-api Worker 未實作 /charts/:id/scores，跳過該請求改由前端本地計算 */
  const SUPPORTS_CHARTS_SCORES = false;

  /**
   * 站點主網址（用於諮詢連結等）
   */
  const SITE_URL = "https://www.17gonplay.com";

  /**
   * GA4 Measurement ID（與 index.html 的 window.GA_MEASUREMENT_ID 同步）
   * 用於自訂事件；留空或無效則不發送。
   */
  const GA_MEASUREMENT_ID = (typeof window !== "undefined" && window.GA_MEASUREMENT_ID) || "";

  /**
   * 狀態標籤映射表（根據內部等級 1-5）
   * 依 I18n 語系回傳，無 I18n 時 fallback 繁中
   */
  function getStatusLabels() {
    const t = (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function")
      ? window.I18n.t.bind(window.I18n)
      : null;
    const fallback = { 5: "結構高度對齊", 4: "動能穩定增強", 3: "結構穩定運行", 2: "關鍵節點待修正", 1: "結構基礎需重建" };
    if (!t) return fallback;
    return {
      5: t("ui.statusExcellent") || fallback[5],
      4: t("ui.statusStrong") || fallback[4],
      3: t("ui.statusStable") || fallback[3],
      2: t("ui.statusSteady") || fallback[2],
      1: t("ui.statusBase") || fallback[1],
    };
  }
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

  // 導出到 window.Config（STATUS_LABELS 為 getter，每次存取依當前 I18n 語系）
  if (typeof window !== "undefined") {
    window.Config = {
      API_BASE,
      REMOTE_API_BASE,
      LOCAL_WORKER_API_BASE,
      LIFEBOOK_BETA_PERMANENT_CODE,
      LIFEBOOK_FEEDBACK_URL,
      SUPPORTS_CHARTS_SCORES,
      SITE_URL,
      GA_MEASUREMENT_ID,
      get STATUS_LABELS() { return getStatusLabels(); },
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
      API_BASE,
      REMOTE_API_BASE,
      LOCAL_WORKER_API_BASE,
      LIFEBOOK_BETA_PERMANENT_CODE,
      LIFEBOOK_FEEDBACK_URL,
      SUPPORTS_CHARTS_SCORES,
      SITE_URL,
      GA_MEASUREMENT_ID,
      get STATUS_LABELS() { return getStatusLabels(); },
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
