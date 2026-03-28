/**
 * bootstrap.js — 頁面初始化：VH、LINE 偵測、手機選單、啟動動畫載入
 * 需在 app.js 之前載入，無 defer
 */
(function () {
  "use strict";

  // 1. 動態 VH fallback（100vh 於行動裝置修正）
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  }
  setVh();
  window.addEventListener("resize", setVh);
  window.addEventListener("orientationchange", function () {
    setTimeout(setVh, 100);
  });

  // 2. LINE 環境偵測
  if (/Line\//i.test(navigator.userAgent) || /LIFF/i.test(navigator.userAgent)) {
    document.body.classList.add("line-browser");
  }

  // 3. 手機版漢堡選單
  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("mobileNavToggle");
    var menu = document.getElementById("mobileNavMenu");
    if (!toggle || !menu) return;
    function openMenu() {
      menu.classList.add("mobile-nav-menu-open");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      menu.classList.remove("mobile-nav-menu-open");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("mobile-nav-menu-open")) closeMenu();
      else openMenu();
    });
    document.querySelectorAll("#mobileNavMenu .mobile-nav-link").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });

    // 章節折疊由 section-collapse.js 統一處理（儀表板載入時初始化）
  });

  // 4. process stub（startup-sequence 需要）
  if (typeof process === "undefined") {
    window.process = { env: { NODE_ENV: "production" } };
  }

  // 5. 動態載入 startup-sequence.js
  document.addEventListener("DOMContentLoaded", function () {
    fetch("/dist/startup-sequence.js", { method: "HEAD" })
      .then(function (res) {
        if (!res.ok) return;
        var ct = res.headers.get("content-type") || "";
        if (ct.indexOf("javascript") === -1) return;
        var s = document.createElement("script");
        s.src = "/dist/startup-sequence.js";
        s.defer = true;
        s.onerror = function () {
          console.warn("startup-sequence.js 載入失敗");
        };
        document.head.appendChild(s);
      })
      .catch(function () {});
  });
})();
