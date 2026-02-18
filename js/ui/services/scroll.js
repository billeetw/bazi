/* scroll.js
 * 單一 scroll 管理架構
 * 導出到 window.UiServices.Scroll
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * @returns {boolean} 是否為桌機（>= 1280px）
   */
  function isDesktop() {
    return window.innerWidth >= 1280;
  }

  /**
   * 捲動至指定區塊
   * @param {string} id - 元素 id（可含或不含 #）
   * @param {Object} [opts]
   * @param {string} [opts.behavior] - "smooth" | "auto"
   * @param {string} [opts.block] - "start" | "nearest" | "center"
   * @param {boolean} [opts.allowOnMobile] - 若 false 且非桌機，直接 return 不捲動
   * @param {boolean} [opts.updateHash] - 若 true，使用 history.replaceState 更新 hash
   */
  function scrollToSection(id, opts) {
    const o = opts || {};
    const behavior = o.behavior || "smooth";
    const block = o.block || "start";
    const allowOnMobile = o.allowOnMobile === true;
    const updateHash = o.updateHash === true;

    if (!allowOnMobile && !isDesktop()) {
      return;
    }

    const rawId = (id || "").replace(/^#/, "");
    const el = document.getElementById(rawId);
    if (!el) return;

    el.scrollIntoView({ behavior, block });

    if (updateHash && rawId) {
      try {
        window.history.replaceState(null, "", "#" + rawId);
      } catch (e) {}
    }
  }

  if (!window.UiServices) {
    window.UiServices = {};
  }
  window.UiServices.Scroll = {
    isDesktop,
    scrollToSection,
  };
})();
