/**
 * astro-locale.js
 * 語系推導：deterministic hard fallback
 * inferI18nLocale / inferComputeLanguage / inferContentLocale
 */
(function (global) {
  "use strict";

  /**
   * 取得當前 UI 語系
   * @returns {string} zh-TW | zh-CN | en
   */
  function inferI18nLocale() {
    if (typeof window === "undefined" || !window.I18n) return "zh-TW";
    const loc = (typeof window.I18n.getLocale === "function" ? window.I18n.getLocale() : "") || "";
    const s = String(loc).trim();
    if (s === "en" || s.startsWith("en")) return "en";
    if (s === "zh-CN" || s.startsWith("zh-CN")) return "zh-CN";
    return "zh-TW";
  }

  /**
   * 推導 compute/all 的 language 參數
   * en* => en-US, zh-CN* => zh-CN, else => zh-TW
   */
  function inferComputeLanguage(i18nLocale) {
    const s = String(i18nLocale ?? "").trim();
    if (s === "en" || s.startsWith("en")) return "en-US";
    if (s === "zh-CN" || s.startsWith("zh-CN")) return "zh-CN";
    return "zh-TW";
  }

  /**
   * 推導 content/2026 的 locale 參數
   * en* => en, zh-CN* => zh-CN, else => zh-TW
   */
  function inferContentLocale(i18nLocale) {
    const s = String(i18nLocale ?? "").trim();
    if (s === "en" || s.startsWith("en")) return "en";
    if (s === "zh-CN" || s.startsWith("zh-CN")) return "zh-CN";
    return "zh-TW";
  }

  /** @deprecated 使用 inferComputeLanguage */
  function getIzTroLanguage(i18nLocale) {
    return inferComputeLanguage(i18nLocale || inferI18nLocale());
  }

  /** @deprecated 使用 inferContentLocale */
  function mapToContentLocale(i18nLocale) {
    return inferContentLocale(i18nLocale || inferI18nLocale());
  }

  if (typeof global !== "undefined") {
    global.inferI18nLocale = inferI18nLocale;
    global.inferComputeLanguage = inferComputeLanguage;
    global.inferContentLocale = inferContentLocale;
    global.getIzTroLanguage = getIzTroLanguage;
    global.mapToContentLocale = mapToContentLocale;
  }
})(typeof window !== "undefined" ? window : this);
