/* navigation.js
 * 导航和路由模块
 * 导出到 window.UiServices.Navigation
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 依當前 hash 同步導航／戰略標籤的 aria-current，並套用 amber 強調樣式
   */
  function syncNavChipActive() {
    const hash = (window.location.hash || "").trim() || "#ws-ziwei";
    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (href === hash) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /**
   * 戰略維度切換：點擊 nav-chip 時先淡出再滾動，再淡入（150–250ms）
   */
  function initDashboardContentTransition() {
    const content = document.getElementById("dashboardMainContent");
    if (!content || content.hasAttribute("data-transition-bound")) return;
    content.setAttribute("data-transition-bound", "1");
    
    function bindHashLink(a) {
      a.addEventListener("click", function (e) {
        const href = (this.getAttribute("href") || "").trim();
        if (!href || href === "#") return;
        const id = href.slice(1);
        if (!document.getElementById(id)) return;
        e.preventDefault();
        content.classList.add("dashboard-content-fade");
        const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 180;
        setTimeout(() => {
          window.location.hash = href;
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            content.classList.remove("dashboard-content-fade");
          }, dur);
        }, dur);
      });
    }

    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach(bindHashLink);
    document.querySelectorAll(".bottom-nav a[href^=\"#\"]").forEach(bindHashLink);
    window.addEventListener("hashchange", syncNavChipActive);
  }

  // 导出到 window.UiServices.Navigation
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.Navigation = {
    syncNavChipActive,
    initDashboardContentTransition,
  };
})();
