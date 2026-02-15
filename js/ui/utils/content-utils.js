/* content-utils.js
 * Content dict lookup with locale fallback and debug-mode missing-key logging
 * Used by: palace-detail, strategic-panel, wuxing-meaning, data-renderer
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  function isDebugMode() {
    try {
      if (typeof window.location === "undefined") return false;
      if (/^localhost(:\d+)?$/i.test(window.location.hostname)) return true;
      return new URLSearchParams(window.location.search).get("debug") === "1";
    } catch (e) {
      return false;
    }
  }

  var _missingKeys = {};

  /**
   * Get content value from dbContent with fallback.
   * dbContent is already merged (requested locale + zh-TW) by ApiService.loadDbContent.
   * @param {Object} dbContent - Merged content from loadDbContent
   * @param {string} category - "palaces" | "stars" | "tenGods" | "wuxing"
   * @param {string} key - Lookup key (e.g. "命宮", "天梁")
   * @param {string} [defaultText] - Fallback when missing (e.g. i18n "no data" string)
   * @returns {string|null} Content value or defaultText or "(missing: category:key)" in debug mode
   */
  function getContentValue(dbContent, category, key, defaultText) {
    var dict = dbContent && dbContent[category];
    if (!dict || typeof dict !== "object") {
      if (isDebugMode() && key) {
        var fullKey = category + ":" + key;
        if (!_missingKeys[fullKey]) {
          _missingKeys[fullKey] = true;
          if (window.console) window.console.log("[content] missing dict:", category, "key:", key);
        }
        return "(missing: " + fullKey + ")";
      }
      return defaultText != null ? defaultText : null;
    }
    var val = dict[key];
    if (val != null && val !== "") return val;
    if (isDebugMode() && key) {
      var fullKey = category + ":" + key;
      if (!_missingKeys[fullKey]) {
        _missingKeys[fullKey] = true;
        if (window.console) window.console.log("[content] missing key:", fullKey);
      }
      return "(missing: " + fullKey + ")";
    }
    return defaultText != null ? defaultText : null;
  }

  /**
   * Get wuxing element object { headline, content } with fallback.
   * @param {Object} dbContent
   * @param {string} elementKey - "木" | "火" | "土" | "金" | "水"
   * @param {Object} defaultItem - { headline, content }
   * @returns {Object} { headline, content }
   */
  function getWuxingItem(dbContent, elementKey, defaultItem) {
    var dict = dbContent && dbContent.wuxing;
    var item = dict && dict[elementKey];
    if (item && (item.headline || item.content)) {
      return {
        headline: item.headline || defaultItem?.headline || "",
        content: item.content || defaultItem?.content || "",
      };
    }
    if (isDebugMode()) {
      var fullKey = "wuxing:" + elementKey;
      if (!_missingKeys[fullKey]) {
        _missingKeys[fullKey] = true;
        if (window.console) window.console.log("[content] missing wuxing:", elementKey);
      }
    }
    return defaultItem || { headline: "", content: "" };
  }

  if (!window.UiUtils) window.UiUtils = {};
  window.UiUtils.ContentUtils = {
    getContentValue: getContentValue,
    getWuxingItem: getWuxingItem,
    isDebugMode: isDebugMode,
  };
})();
