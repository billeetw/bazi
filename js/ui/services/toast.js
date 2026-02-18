/* toast.js
 * 頁內 Toast 通知，取代 window.alert
 * 導出到 window.UiServices.Toast
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  const CONTAINER_ID = "toast-container";
  const AUTO_DISMISS_MS = 5000;

  function ensureContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = CONTAINER_ID;
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998;display:flex;flex-direction:column;align-items:center;padding:1rem;padding-top:env(safe-area-inset-top,1rem);box-sizing:border-box;";
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * 顯示 Toast
   * @param {string} message - 訊息內容
   * @param {Object} [opts] - 選項
   * @param {string} [opts.type] - "error" | "info" | "success"，預設 "info"
   * @param {Function} [opts.onRetry] - 若有，顯示「重試」按鈕，點擊時呼叫
   * @param {number} [opts.duration] - 自動關閉毫秒數，0 表示不自動關閉
   */
  function show(message, opts) {
    opts = opts || {};
    const type = opts.type || "info";
    const onRetry = opts.onRetry;
    const duration = opts.duration !== undefined ? opts.duration : (onRetry ? 0 : AUTO_DISMISS_MS);

    const container = ensureContainer();
    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.setAttribute("role", "alert");
    toast.style.cssText =
      "pointer-events:auto;max-width:min(90vw,360px);padding:0.75rem 1rem;border-radius:0.5rem;font-size:0.875rem;line-height:1.4;box-shadow:0 4px 20px rgba(0,0,0,0.4);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.75rem;animation:toast-in 0.25s ease;";

    const isError = type === "error";
    toast.style.background = isError ? "rgba(220,38,38,0.95)" : "rgba(26,26,46,0.98)";
    toast.style.border = isError ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(255,255,255,0.1)";
    toast.style.color = "#fff";

    const text = document.createElement("span");
    text.style.flex = "1";
    text.textContent = message;
    toast.appendChild(text);

    if (typeof onRetry === "function") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = (window.I18n && typeof window.I18n.t === "function" ? window.I18n.t("ui.retry") : null) || "重試";
      btn.style.cssText =
        "flex-shrink:0;padding:0.35rem 0.75rem;border-radius:0.375rem;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.15);color:#fff;font-size:0.8125rem;cursor:pointer;transition:background 0.2s;";
      btn.addEventListener("click", function () {
        dismiss();
        onRetry();
      });
      btn.addEventListener("mouseenter", function () {
        btn.style.background = "rgba(255,255,255,0.25)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.background = "rgba(255,255,255,0.15)";
      });
      toast.appendChild(btn);
    }

    function dismiss() {
      toast.style.animation = "toast-out 0.2s ease forwards";
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      const s = window.I18n.t(key);
      return s && s !== key ? s : (fallback != null ? fallback : key);
    }
    return fallback != null ? fallback : key;
  }

  if (!window.UiServices) window.UiServices = {};
  window.UiServices.Toast = { show, t };
})();
