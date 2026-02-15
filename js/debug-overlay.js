/* debug-overlay.js
 * Shows API_BASE, i18nLocale, computeLanguage, payload.language, contentLocale, content response
 * Visible when: localhost OR ?debug=1
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  function isDebugMode() {
    try {
      if (/^localhost(:\d+)?$/i.test(window.location.hostname)) return true;
      return new URLSearchParams(window.location.search).get("debug") === "1";
    } catch (e) {
      return false;
    }
  }

  var state = {
    apiBase: "",
    i18nLocale: "",
    computeLanguage: "",
    contentLocale: "",
    payloadLanguage: "",
    contentOk: null,
    contentLocaleUsed: "",
  };

  function render() {
    var panel = document.getElementById("debugOverlayPanel");
    if (!panel) return;
    panel.innerHTML = `
      <div class="text-[10px] font-mono text-left space-y-0.5">
        <div><span class="text-slate-500">API_BASE:</span> ${escapeHtml(state.apiBase || "—")}</div>
        <div><span class="text-slate-500">i18nLocale:</span> ${escapeHtml(state.i18nLocale || "—")}</div>
        <div><span class="text-slate-500">computeLanguage:</span> ${escapeHtml(state.computeLanguage || "—")}</div>
        <div><span class="text-slate-500">contentLocale:</span> ${escapeHtml(state.contentLocale || "—")}</div>
        <div><span class="text-slate-500">payload.language:</span> ${escapeHtml(state.payloadLanguage || "—")}</div>
        <div><span class="text-slate-500">content ok:</span> ${state.contentOk === null ? "—" : state.contentOk ? "✓" : "✗"}</div>
        <div><span class="text-slate-500">content localeUsed:</span> ${escapeHtml(state.contentLocaleUsed || "—")}</div>
      </div>
    `;
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function init() {
    if (!isDebugMode()) return;

    var inferI18nLocale = typeof window.inferI18nLocale === "function" ? window.inferI18nLocale : null;
    var inferComputeLanguage = typeof window.inferComputeLanguage === "function" ? window.inferComputeLanguage : null;
    var inferContentLocale = typeof window.inferContentLocale === "function" ? window.inferContentLocale : null;

    var i18nLocale = inferI18nLocale ? inferI18nLocale() : (window.I18n && typeof window.I18n.getLocale === "function" ? window.I18n.getLocale() : "zh-TW");
    state.i18nLocale = i18nLocale;
    state.computeLanguage = inferComputeLanguage ? inferComputeLanguage(i18nLocale) : (i18nLocale === "en" ? "en-US" : i18nLocale === "zh-CN" ? "zh-CN" : "zh-TW");
    state.contentLocale = inferContentLocale ? inferContentLocale(i18nLocale) : (i18nLocale === "en" ? "en" : i18nLocale === "zh-CN" ? "zh-CN" : "zh-TW");
    state.apiBase = window.Config?.API_BASE || window.UiServices?.ApiService?.API_BASE || "—";

    var wrap = document.createElement("div");
    wrap.id = "debugOverlayWrap";
    wrap.className = "fixed bottom-4 right-4 z-[100] max-w-[280px] p-2 rounded-lg bg-slate-900/95 border border-amber-400/40 text-slate-200 shadow-xl";
    wrap.innerHTML = '<div class="text-[10px] font-bold text-amber-400 mb-1">DEBUG</div><div id="debugOverlayPanel"></div>';
    document.body.appendChild(wrap);
    render();
  }

  function update(updates) {
    if (!isDebugMode()) return;
    if (updates && typeof updates === "object") {
      if (updates.payloadLanguage !== undefined) state.payloadLanguage = updates.payloadLanguage;
      if (updates.contentOk !== undefined) state.contentOk = updates.contentOk;
      if (updates.contentLocaleUsed !== undefined) state.contentLocaleUsed = updates.contentLocaleUsed;
    }
    render();
  }

  function initWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  initWhenReady();

  window.__debugOverlay = { update: update, isDebugMode: isDebugMode };
})();
