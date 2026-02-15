/**
 * i18n.js — 輕量國際化
 * 語系：zh-TW（預設）、zh-CN、en
 * 用法：I18n.init().then(() => { el.textContent = I18n.t('wuxing.title'); });
 * 切換：I18n.setLocale('en'); 可選 reload 或自行重新渲染
 */
(function (global) {
  "use strict";

  var DEFAULT_LOCALE = "zh-TW";
  var STORAGE_KEY = "locale";
  var PARAM_LANG = "lang";
  var BASE = "/data/i18n";

  var messages = {};
  var currentLocale = DEFAULT_LOCALE;
  var cache = {};

  function getLocale() {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get(PARAM_LANG);
    if (fromUrl && (fromUrl === "zh-TW" || fromUrl === "zh-CN" || fromUrl === "en")) return fromUrl;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "zh-TW" || stored === "zh-CN" || stored === "en")) return stored;
    } catch (e) {}
    return DEFAULT_LOCALE;
  }

  function setLocale(locale, options) {
    if (locale !== "zh-TW" && locale !== "zh-CN" && locale !== "en") return;
    currentLocale = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) {}
    if (options && options.reload) {
      var url = new URL(window.location.href);
      url.searchParams.set(PARAM_LANG, locale);
      window.location.href = url.toString();
    }
    if (typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(new CustomEvent("localechange", { detail: { locale: locale } }));
      } catch (err) {}
    }
  }

  function getByPath(obj, path) {
    var keys = path.split(".");
    var cur = obj;
    for (var i = 0; i < keys.length && cur != null; i++) cur = cur[keys[i]];
    return cur;
  }

  /**
   * 取翻譯字串，支援 {{key}} 替換
   * @param {string} key - 例如 'wuxing.title'、'estimateHour.q1.text'
   * @param {Object} [placeholders] - 例如 { top2: '火、木' }，會替換 {{top2}}
   */
  function t(key, placeholders) {
    var str = getByPath(messages, key);
    if (str == null || typeof str !== "string") return key;
    if (placeholders && typeof placeholders === "object") {
      Object.keys(placeholders).forEach(function (k) {
        str = str.replace(new RegExp("\\{\\{\\s*" + k + "\\s*\\}\\}", "g"), placeholders[k]);
      });
    }
    return str;
  }

  /**
   * 取翻譯物件（例如整題 estimateHour.q1），沒有則回傳 null
   */
  function tObject(key) {
    return getByPath(messages, key) || null;
  }

  function loadLocale(locale) {
    if (cache[locale]) return Promise.resolve(cache[locale]);
    var base = typeof window !== "undefined" && window.__I18N_BASE != null ? window.__I18N_BASE : BASE;
    var url = base + "/" + locale + ".json";
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("i18n load " + r.status);
        return r.json();
      })
      .then(function (data) {
        cache[locale] = data;
        return data;
      });
  }

  /**
   * 初始化：依目前語系載入 JSON，並設為 messages
   * 多處呼叫時共用同一 Promise，避免重複 fetch
   * @returns {Promise<string>} 當前語系
   */
  var _initPromise = null;
  function init() {
    if (_initPromise) return _initPromise;
    currentLocale = getLocale();
    _initPromise = loadLocale(currentLocale).then(function (data) {
      messages = data;
      return currentLocale;
    });
    return _initPromise;
  }

  /**
   * 將當前語系套用到所有 [data-i18n] 元素；可選 [data-i18n-placeholder]、[data-i18n-title]
   */
  function applyToDom() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key && t(key) !== key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key && t(key) !== key) el.placeholder = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (key && t(key) !== key) el.title = t(key);
    });
  }

  /**
   * 切換語系並重新載入文案（不 reload 頁面）；可再觸發 localechange 讓各區塊重繪
   */
  function switchLocale(locale) {
    if (locale === currentLocale) return Promise.resolve(currentLocale);
    return loadLocale(locale).then(function (data) {
      currentLocale = locale;
      messages = data;
      setLocale(locale);
      return currentLocale;
    });
  }

  var I18n = {
    init: init,
    t: t,
    tObject: tObject,
    getLocale: getLocale,
    setLocale: setLocale,
    switchLocale: switchLocale,
    loadLocale: loadLocale,
    applyToDom: applyToDom,
    supportedLocales: ["zh-TW", "zh-CN", "en"],
  };

  if (typeof global !== "undefined") {
    global.I18n = I18n;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = I18n;
  }
})(typeof window !== "undefined" ? window : this);
