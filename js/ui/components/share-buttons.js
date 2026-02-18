/* share-buttons.js
 * 分享按鈕組件：LINE、Facebook、Web Share API
 * 導出到 window.UiComponents.ShareButtons
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  const SITE_URL = (typeof window !== "undefined" && window.Config?.SITE_URL) || "https://www.17gonplay.com";

  function t(key) {
    if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(key);
    const fallback = {
      "share.title": "分享",
      "share.toLine": "分享到 LINE",
      "share.toFb": "分享到 Facebook",
      "share.text": "我剛用人生說明書看了我的 2026 流年，免費取得八字五行與紫微 12 宮分析，你也來試試！",
    };
    return fallback[key] || key;
  }

  function getShareUrl() {
    return SITE_URL + "/";
  }

  function getShareText() {
    return t("share.text");
  }

  function shareToLine() {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    window.open("https://social-plugins.line.me/lineit/share?url=" + url + "&text=" + text, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  function shareToFb() {
    const url = encodeURIComponent(getShareUrl());
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  function shareNative() {
    if (!navigator.share) return false;
    navigator.share({
      title: "人生說明書｜八字紫微 2026 戰略",
      text: getShareText(),
      url: getShareUrl(),
    }).catch(() => {});
    return true;
  }

  /**
   * 建立分享按鈕群組（LINE + FB，支援 Web Share 時顯示原生按鈕）
   */
  function createShareButtons() {
    const wrap = document.createElement("div");
    wrap.className = "flex items-center gap-2 share-buttons-wrap";

    const lineBtn = document.createElement("button");
    lineBtn.type = "button";
    lineBtn.className = "nav-chip share-btn share-line text-xs inline-flex items-center gap-1.5";
    lineBtn.setAttribute("aria-label", t("share.toLine"));
    lineBtn.innerHTML = '<span class="opacity-90">📤</span> LINE';
    lineBtn.addEventListener("click", shareToLine);

    const fbBtn = document.createElement("button");
    fbBtn.type = "button";
    fbBtn.className = "nav-chip share-btn share-fb text-xs inline-flex items-center gap-1.5";
    fbBtn.setAttribute("aria-label", t("share.toFb"));
    fbBtn.innerHTML = '<span class="opacity-90">FB</span>';
    fbBtn.addEventListener("click", shareToFb);

    wrap.appendChild(lineBtn);
    wrap.appendChild(fbBtn);

    if (navigator.share) {
      const nativeBtn = document.createElement("button");
      nativeBtn.type = "button";
      nativeBtn.className = "nav-chip share-btn share-native text-xs inline-flex items-center gap-1.5";
      nativeBtn.setAttribute("aria-label", t("share.title"));
      nativeBtn.innerHTML = '<span class="opacity-90">📤</span> ' + t("share.title");
      nativeBtn.addEventListener("click", shareNative);
      wrap.appendChild(nativeBtn);
    }

    return wrap;
  }

  /**
   * 在導覽列添加分享按鈕
   */
  function addShareToNav() {
    const nav = document.getElementById("workspaceNav");
    if (!nav || nav.querySelector(".share-buttons-wrap")) return;
    const shareWrap = createShareButtons();
    nav.appendChild(shareWrap);
  }

  /**
   * 在底部導覽添加分享按鈕
   */
  function addShareToBottomNav() {
    const bottomNav = document.querySelector(".bottom-nav");
    if (!bottomNav || bottomNav.querySelector(".share-buttons-wrap")) return;
    const shareWrap = createShareButtons();
    bottomNav.appendChild(shareWrap);
  }

  /**
   * 在摘要區添加分享按鈕（若有 ws-summary）
   */
  function addShareToSummary() {
    const summary = document.getElementById("ws-summary");
    if (!summary || summary.querySelector(".share-buttons-wrap")) return;
    const navChips = summary.querySelector(".flex.flex-wrap.gap-2");
    if (!navChips) return;
    const shareWrap = createShareButtons();
    navChips.appendChild(shareWrap);
  }

  /**
   * 整合分享按鈕到多處
   */
  function integrateShare(options) {
    const { showInNav = true, showInBottomNav = true, showInSummary = true } = options || {};
    if (showInNav) addShareToNav();
    if (showInBottomNav) addShareToBottomNav();
    if (showInSummary) addShareToSummary();
  }

  if (!window.UiComponents) window.UiComponents = {};
  window.UiComponents.ShareButtons = {
    integrateShare,
    addShareToNav,
    addShareToBottomNav,
    addShareToSummary,
    createShareButtons,
  };
})();
