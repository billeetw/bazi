/**
 * 首頁占卦雙入口：卡片點擊開啟 Drawer，iframe 載入 divination.html
 * 若用戶已輸入時辰，傳遞 birth 參數供占卦結果引用
 */

(function () {
  "use strict";

  const CARD_ID = "divinationEntranceCard";
  const BACKDROP_ID = "divinationOverlayBackdrop";
  const OVERLAY_ID = "divinationOverlay";
  const IFRAME_ID = "divinationOverlayIframe";
  const CLOSE_ID = "divinationOverlayClose";

  function getBirthParamsFromForm() {
    const year = document.getElementById("birthYear")?.value;
    const month = document.getElementById("birthMonth")?.value;
    const day = document.getElementById("birthDay")?.value;
    const hour = document.getElementById("birthHour")?.value;
    const minute = document.getElementById("birthMinute")?.value;
    const gender = document.getElementById("gender")?.value;
    const timeMode = document.getElementById("timeMode")?.value;
    const shichen = document.getElementById("birthShichen")?.value;
    const shichenHalf = document.getElementById("birthShichenHalf")?.value;
    if (!year || !month || !day) return {};
    const params = { birthYear: year, birthMonth: month, birthDay: day };
    if (hour) params.birthHour = hour;
    if (minute) params.birthMinute = minute;
    if (gender) params.gender = gender;
    if (timeMode) params.timeMode = timeMode;
    if (shichen) params.birthShichen = shichen;
    if (shichenHalf) params.birthShichenHalf = shichenHalf;
    return params;
  }

  function buildDivinationUrl() {
    const base = window.location.origin + "/divination.html";
    const params = new URLSearchParams();
    params.set("from", "homepage");
    params.set("embed", "1");
    const birth = getBirthParamsFromForm();
    Object.keys(birth).forEach(function (k) {
      params.set(k, String(birth[k]));
    });
    return base + "?" + params.toString();
  }

  function openOverlay() {
    const backdrop = document.getElementById(BACKDROP_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    const iframe = document.getElementById(IFRAME_ID);
    if (!backdrop || !overlay || !iframe) return false;
    iframe.src = buildDivinationUrl();
    backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      backdrop.classList.add("opacity-100");
      overlay.classList.remove("translate-x-full");
    });
    return true;
  }

  function closeOverlay() {
    const backdrop = document.getElementById(BACKDROP_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    const iframe = document.getElementById(IFRAME_ID);
    if (!backdrop || !overlay || !iframe) return;
    backdrop.classList.remove("opacity-100");
    overlay.classList.add("translate-x-full");
    document.body.style.overflow = "";
    setTimeout(function () {
      backdrop.classList.add("hidden");
      iframe.src = "about:blank";
    }, 300);
  }

  function init() {
    const card = document.getElementById(CARD_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    const closeBtn = document.getElementById(CLOSE_ID);
    if (!card) return;

    card.addEventListener("click", function (e) {
      if (window.gtag && window.GA_MEASUREMENT_ID) {
        window.gtag("event", "divination_entrance_click", { from: "homepage" });
      }
      if (openOverlay()) {
        e.preventDefault();
      }
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeOverlay);
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", closeOverlay);
    }

    window.addEventListener("message", function (e) {
      if (e.data && e.data.type === "divination-close-overlay") {
        closeOverlay();
      }
    });
  }

  function runInit() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 50); });
    } else {
      setTimeout(init, 50);
    }
  }
  runInit();
})();
