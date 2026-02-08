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
   * 重置到首頁：隱藏系統區域，顯示輸入表單，滾動到頂部
   */
  function resetToHome() {
    console.log("[navigation.js] 重置到首頁");
    
    // 隱藏系統區域
    const systemEl = document.getElementById("system");
    if (systemEl) {
      systemEl.classList.add("hidden");
    }
    
    // 顯示輸入表單
    const inputCardEl = document.getElementById("inputCard");
    if (inputCardEl) {
      inputCardEl.classList.remove("hidden");
    }
    
    // 隱藏活動報名區域（如果存在）
    const activity213El = document.getElementById("activity-213");
    if (activity213El) {
      activity213El.classList.remove("hidden");
    }
    
    // 隱藏工作區導航
    const workspaceNavEl = document.getElementById("workspaceNav");
    if (workspaceNavEl) {
      workspaceNavEl.classList.add("hidden");
    }
    
    // 移除 dashboard-visible 類
    document.body.classList.remove("dashboard-visible");
    
    // 清除 URL hash
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    console.log("[navigation.js] 首頁重置完成");
  }

  /**
   * 綁定首頁按鈕事件
   */
  function bindHomeButton() {
    const homeButton = document.getElementById("homeButton");
    const mobileHomeLink = document.getElementById("mobileHomeLink");
    function bindReset(el) {
      if (!el) return;
      el.addEventListener("click", function(e) {
        e.preventDefault();
        resetToHome();
      });
    }
    bindReset(homeButton);
    bindReset(mobileHomeLink);
    if (homeButton || mobileHomeLink) {
      console.log("[navigation.js] 首頁按鈕已綁定");
    }
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
    resetToHome,
    bindHomeButton,
  };
})();
