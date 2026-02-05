/* dom-helpers.js
 * DOM 操作工具函数
 * 导出到 window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /** 數值緩動：僅在值實際變更時從 0（或當前值）動到目標值，支援 prefers-reduced-motion */
  function animateValue(el, to, opts) {
    if (!el || typeof to !== "number" || !Number.isFinite(to)) return;
    const duration = (opts && opts.duration != null) ? opts.duration : 450;
    const decimals = (opts && opts.decimals != null) ? opts.decimals : 1;
    const prev = el.getAttribute("data-animated-value");
    const from = prev !== null && prev !== "" ? Number(prev) : 0;
    if (from === to && prev !== null) return;
    el.setAttribute("data-animated-value", String(to));
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 0 : duration;
    const start = performance.now();
    function tick(now) {
      const t = dur <= 0 ? 1 : Math.min((now - start) / dur, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(decimals);
    }
    requestAnimationFrame(tick);
  }

  /** 取得當前年齡（虛歲）：從 #currentAgeSlider 或依出生年推算 */
  function getCurrentAge(lastBirthYear) {
    const slider = document.getElementById("currentAgeSlider");
    if (slider && slider.value !== "" && Number.isFinite(Number(slider.value))) {
      return Math.max(1, Math.min(120, Number(slider.value)));
    }
    if (lastBirthYear != null) {
      return Math.max(1, new Date().getFullYear() - Number(lastBirthYear));
    }
    return 38;
  }

  /** 同步小限滑桿顯示與數值 */
  function syncAgeSliderDisplay(age) {
    const slider = document.getElementById("currentAgeSlider");
    const display = document.getElementById("currentAgeDisplay");
    const a = Math.max(1, Math.min(120, Number(age) || 38));
    if (slider) slider.value = String(a);
    if (display) display.textContent = String(a);
  }

  /** 閃爍提示效果 */
  function flashPeek(el) {
    if (!el) return;
    el.classList.add("peek-highlight");
    window.setTimeout(() => el.classList.remove("peek-highlight"), 1200);
  }

  /** 打開移動端底部面板 */
  function openPalaceSheet() {
    const sheet = document.getElementById("palaceSheet");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (!sheet) return;
    sheet.classList.add("open");
    if (backdrop) backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  /** 關閉移動端底部面板 */
  function closePalaceSheet() {
    const sheet = document.getElementById("palaceSheet");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (!sheet) return;
    sheet.classList.remove("open");
    if (backdrop) backdrop.classList.add("hidden");
    document.body.style.overflow = "";
    // 清除當前選中的宮位追蹤（如果有的話）
    if (window.BaziApp?.State) {
      window.BaziApp.State.setState("currentSelectedPalace", null);
    } else if (window.currentSelectedPalace) {
      window.currentSelectedPalace = null;
    }
  }

  /** 設置移動端底部面板內容（通用） */
  function setMobileSheetContent({ title, sub, bodyHtml }) {
    const mTitle = document.getElementById("mobilePalaceTitle");
    const mSub = document.getElementById("mobilePalaceSub");
    const mBody = document.getElementById("mobilePalaceBody");
    if (mTitle) mTitle.textContent = title || "";
    if (mSub) mSub.textContent = sub || "";
    if (mBody) mBody.innerHTML = bodyHtml || "";
  }

  // 導出到 window.UiDomHelpers
  window.UiDomHelpers = {
    animateValue,
    getCurrentAge,
    syncAgeSliderDisplay,
    flashPeek,
    openPalaceSheet,
    closePalaceSheet,
    setMobileSheetContent,
  };
})();
